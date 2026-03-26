import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { unzipSync } from "fflate";

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

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const modeParam = String(formData.get("mode") ?? "append");
  const mode = modeParam === "replace" ? "replace" : "append";
  const dryRun = String(formData.get("dryRun") ?? "false").toLowerCase() === "true";

  const params = await context.params;
  const product = await findProduct(params.id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const bucket = env.ASSETS_BUCKET ?? env.S3_BUCKET;
  if (!bucket) {
    throw new Error("ASSETS_BUCKET or S3_BUCKET env var is required");
  }

  const filename = typeof file.name === "string" ? file.name : "";
  const lowerFilename = filename.toLowerCase();
  const mime = file.type?.toLowerCase() ?? "";

  if (!lowerFilename.endsWith(".zip") && !["application/zip", "application/x-zip-compressed"].includes(mime)) {
    return NextResponse.json({ error: "Only ZIP archives are supported" }, { status: 415 });
  }

  const variantIdSet = new Set(product.variants.map((variant) => variant.id));

  let manifestLookup: ManifestLookup | undefined;
  const processedImages: ProcessedImage[] = [];

  const archiveEntries = unzipSync(new Uint8Array(await file.arrayBuffer()));

  for (const [entryPath, content] of Object.entries(archiveEntries)) {
    if (entryPath.endsWith("/")) continue;

    const { normalizedPath, safeFileName } = sanitizeZipPath(entryPath);
    if (!safeFileName) continue;

    if (normalizedPath.endsWith(".ds_store") || normalizedPath.startsWith("__macosx")) continue;

    if (normalizedPath.endsWith("mockups.json")) {
      try {
        const manifestJson = JSON.parse(Buffer.from(content).toString("utf-8"));
        manifestLookup = parseMockupsManifest(manifestJson, product.variants);
      } catch (error) {
        console.warn("Failed to parse mockups.json:", error);
      }
      continue;
    }

    const ext = path.extname(safeFileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;

    const buffer = Buffer.from(content);
    if (buffer.length === 0) continue;

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const key = `products/${product.slug}/${hash}-${safeFileName}`;
    const contentType = MIME_LOOKUP[ext] ?? "application/octet-stream";

    if (!dryRun) {
      await putObjectStream({
        bucket,
        key,
        body: Readable.from([buffer]),
        contentType,
        cacheControl: CACHE_CONTROL,
      });
    }

    processedImages.push({
      normalizedPath,
      safeFileName,
      key,
    });
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
