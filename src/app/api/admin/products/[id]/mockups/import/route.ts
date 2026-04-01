import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { Unzip, UnzipInflate, type UnzipFile } from "fflate";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { isAdmin } from "@/server/auth/isAdmin";
import {
  parseMockupsManifest,
  resolveMockupMetadata,
  sanitizeZipPath,
  type ManifestLookup,
  type VariantSummary,
} from "@/server/mockups/metadata";
import { putObjectStream } from "@/server/storage/s3";
import logger from "@/lib/logger";

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

const MIME_LOOKUP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

const CACHE_CONTROL = "public, max-age=31536000, immutable";

type ProductIdentifier = { id: number; slug: string; variants: VariantSummary[] };
type ProcessedImage = {
  normalizedPath: string;
  safeFileName: string;
  key: string;
};

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> };

async function findProduct(identifier: string): Promise<ProductIdentifier | null> {
  const where = /^\d+$/.test(identifier) ? { id: Number(identifier) } : { slug: identifier };

  const product = await prisma.product.findUnique({
    where,
    select: {
      id: true,
      slug: true,
      variants: {
        select: {
          id: true,
          printfulVariantId: true,
          color: true,
          size: true,
        },
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    slug: product.slug,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      printfulVariantId: variant.printfulVariantId,
      color: variant.color,
      size: variant.size,
    })),
  };
}

export async function POST(req: NextRequest, context: RouteContext) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Read mode/dryRun from query params (body is raw binary ZIP)
  const searchParams = req.nextUrl.searchParams;
  const modeParam = searchParams.get("mode") ?? "append";
  const mode = modeParam === "replace" ? "replace" : "append";
  const dryRun = searchParams.get("dryRun")?.toLowerCase() === "true";

  const params = await context.params;
  const product = await findProduct(params.id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const bucket = env.ASSETS_BUCKET ?? env.S3_BUCKET;
  if (!bucket) {
    throw new Error("ASSETS_BUCKET or S3_BUCKET env var is required");
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("zip") && !contentType.includes("octet-stream")) {
    return NextResponse.json({ error: "Only ZIP archives are supported" }, { status: 415 });
  }

  if (!req.body) {
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  // Stream body directly to bypass Next.js 10 MB formData limit
  const chunks: Buffer[] = [];
  const reader = req.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  const zipBuffer = Buffer.concat(chunks);

  if (zipBuffer.length === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const variantIdSet = new Set(product.variants.map((variant) => variant.id));

  let manifestLookup: ManifestLookup | undefined;
  const processedImages: ProcessedImage[] = [];

  // Pass 1: parse ZIP structure, queue all file handles — no decompression yet
  interface QueuedEntry { file: UnzipFile; normalizedPath: string; safeFileName: string }
  const fileQueue: QueuedEntry[] = [];

  const unzipper = new Unzip();
  unzipper.register(UnzipInflate);

  unzipper.onfile = (file) => {
    if (file.name.endsWith("/")) return;
    const { normalizedPath, safeFileName } = sanitizeZipPath(file.name);
    if (!safeFileName) return;
    if (normalizedPath.endsWith(".ds_store") || normalizedPath.startsWith("__macosx")) return;
    fileQueue.push({ file, normalizedPath, safeFileName });
  };

  unzipper.push(new Uint8Array(zipBuffer), true);

  // Pass 2: decompress one entry at a time — each image buffer is GC'd before the next begins
  for (const { file, normalizedPath, safeFileName } of fileQueue) {
    const entryChunks: Uint8Array[] = [];
    await new Promise<void>((resolve, reject) => {
      file.ondata = (err, data, final) => {
        if (err) { reject(err); return; }
        entryChunks.push(data);
        if (final) resolve();
      };
      file.start();
    });

    const totalLen = entryChunks.reduce((n, c) => n + c.length, 0);
    const content = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of entryChunks) { content.set(chunk, offset); offset += chunk.length; }

    if (normalizedPath.endsWith("mockups.json")) {
      try {
        const manifestJson = JSON.parse(Buffer.from(content).toString("utf-8"));
        manifestLookup = parseMockupsManifest(manifestJson, product.variants);
      } catch (error) {
        logger.warn({ err: error }, "Failed to parse mockups.json");
      }
      continue;
    }

    const ext = path.extname(safeFileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;

    const buffer = Buffer.from(content);
    if (buffer.length === 0) continue;

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const key = `products/${product.slug}/${hash}-${safeFileName}`;
    const mimeType = MIME_LOOKUP[ext] ?? "application/octet-stream";

    if (!dryRun) {
      await putObjectStream({
        bucket,
        key,
        body: Readable.from([buffer]),
        contentType: mimeType,
        cacheControl: CACHE_CONTROL,
      });
    }

    processedImages.push({ normalizedPath, safeFileName, key });
    // buffer + entryChunks drop out of scope here → GC'd before next iteration
  }

  if (!processedImages.length) {
    return NextResponse.json({ importedCount: 0, productId: product.id });
  }

  const sortIndexStart =
    mode === "append"
      ? ((await prisma.productImage.aggregate({
          where: { productId: product.id, selected: true },
          _max: { sortIndex: true },
        }))._max.sortIndex ?? -1) + 1
      : 0;

  const uniqueKeys = new Set<string>();
  const usedSortIndexes = new Set<number>();
const records: Array<{
  productId: number;
  variantId: number | null;
  url: string;
  kind: string;
  placement: string | null;
  width: number | null;
  height: number | null;
  source: "mockup";
  selected: boolean;
  sortIndex: number;
}> = [];

  for (const image of processedImages) {
    if (uniqueKeys.has(image.key)) continue;
    uniqueKeys.add(image.key);

    const metadata = resolveMockupMetadata(image.normalizedPath, {
      manifest: manifestLookup,
      variants: product.variants,
      fallbackSortIndex: sortIndexStart + records.length,
    });

    let sortIndex = metadata.sortIndex ?? sortIndexStart + records.length;
    while (usedSortIndexes.has(sortIndex)) {
      sortIndex += 1;
    }
    usedSortIndexes.add(sortIndex);

    const variantId = metadata.variantId && variantIdSet.has(metadata.variantId) ? metadata.variantId : undefined;

    records.push({
      productId: product.id,
      variantId: variantId ?? null,
      url: image.key,
      kind: "mockup",
      placement: metadata.placement ?? null,
      width: null,
      height: null,
      source: "mockup",
      selected: true,
      sortIndex,
    });
  }

  if (!records.length) {
    return NextResponse.json({ importedCount: 0, productId: product.id });
  }

  if (!dryRun) {
    await prisma.$transaction(async (tx) => {
      if (mode === "replace") {
        await tx.productImage.updateMany({
          where: { productId: product.id, selected: true },
          data: { selected: false },
        });
      }

      const existing = await tx.productImage.findMany({
        where: {
          productId: product.id,
          url: { in: records.map((record) => record.url) },
        },
        select: { id: true, url: true },
      });
      const existingByUrl = new Map(existing.map((entry) => [entry.url, entry]));

      const toCreate: typeof records = [];
      const toUpdate: Array<{ id: number; data: Partial<typeof records[number]> }> = [];

      for (const record of records) {
        const match = existingByUrl.get(record.url);
        if (match) {
          toUpdate.push({
            id: match.id,
            data: {
              variantId: record.variantId,
              placement: record.placement,
              sortIndex: record.sortIndex,
              selected: record.selected,
              kind: record.kind,
              width: record.width,
              height: record.height,
              source: record.source,
            },
          });
        } else {
          toCreate.push(record);
        }
      }

      if (toCreate.length) {
        await tx.productImage.createMany({ data: toCreate });
      }

      for (const update of toUpdate) {
        await tx.productImage.update({
          where: { id: update.id },
          data: {
            variantId: update.data.variantId ?? null,
            placement: update.data.placement ?? null,
            sortIndex: update.data.sortIndex,
            selected: update.data.selected ?? true,
            kind: update.data.kind ?? "mockup",
            width: update.data.width ?? null,
            height: update.data.height ?? null,
            source: update.data.source ?? "mockup",
          },
        });
      }
    });
  }

  return NextResponse.json({
    importedCount: records.length,
    productId: product.id,
  });
}
