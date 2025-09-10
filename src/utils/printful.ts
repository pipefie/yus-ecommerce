// src/utils/printful.ts
// Printful integration based on the provided openapi.json (Sync API)
// Uses OAuth Bearer token and optional X-PF-Store-Id header for account-level tokens.
import slugify from "slugify";
import { prisma } from "@/lib/prisma";

const BASE = "https://api.printful.com";
const TOKEN = process.env.PRINTFUL_TOKEN || process.env.PRINTFUL_API_KEY || "";
const STOREID = process.env.PRINTFUL_STORE_ID;

function buildHeaders(extra: HeadersInit = {}): HeadersInit {
  if (!TOKEN) throw new Error("Missing PRINTFUL_TOKEN (or PRINTFUL_API_KEY) env var");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
  if (STOREID) headers["X-PF-Store-Id"] = String(STOREID);
  return { ...headers, ...(extra as Record<string, string>) };
}

async function callPrintful(path: string, opts: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: buildHeaders(opts.headers || {}),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof (json as any)?.result === "string" ? (json as any).result : JSON.stringify(json);
    throw new Error(`Printful ${path} ${res.status}: ${detail}`);
  }
  return (json as any).result;
}

// Public types used across the app
export interface SummaryProduct {
  printfulProductId: number;
  slug: string;
  title: string;
  description: string;
  price: number; // in cents
  thumbnail: string;
}

interface RawPrintfulFile {
  src: string;
  type?: string;
  placement?: string;
}

interface RawPrintfulVariant {
  id: number;          // prefer catalog variant_id below
  price: number;
  title?: string; // legacy; Sync API uses `name`
  name?: string;  // Sync API variant name
  color?: string; // present when linked to catalog variant
  size?: string;  // present when linked to catalog variant
  files?: RawPrintfulFile[];
  variant_id?: number; // catalog variant id (preferred for ordering)
}

interface RawPrintfulProduct {
  id: number;
  title?: string;
  description?: string;
  images?: RawPrintfulFile[];
  variants: RawPrintfulVariant[];
}

export async function fetchPrintfulProducts(): Promise<RawPrintfulProduct[]> {
  // GET /sync/products (paged)
  let offset = 0;
  const limit = 50;
  const out: RawPrintfulProduct[] = [];
  for (;;) {
    const items: any[] = await callPrintful(`/sync/products?offset=${offset}&limit=${limit}`);
    if (!Array.isArray(items) || items.length === 0) break;
    for (const sp of items) {
      out.push({
        id: sp.id,
        title: sp.name,
        description: "",
        images: sp.thumbnail_url ? [{ src: sp.thumbnail_url }] : [],
        variants: [],
      });
    }
    offset += limit;
  }
  return out;
}

export function mapToSummary(p: RawPrintfulProduct): SummaryProduct {
  const firstImage = p.images?.[0]?.src || "/placeholder.png";
  const firstVariant: any = p.variants?.[0] || { price: 0 };
  return {
    printfulProductId: p.id,
    slug: slugify(p.title || `#${p.id}`, { lower: true, strict: true }),
    title: String(p.title),
    description: p.description || "",
    price: Math.round(Number(firstVariant.price) * 100) || 0,
    thumbnail: firstImage,
  };
}

// Full product detail for the product page
export interface DetailedVariant {
  id: number;
  price: number; // in cents
  color: string;
  size: string;
  designUrls: string[]; // all mockup URLs for this color/size
}

export interface DetailedProduct {
  printfulProductId: number;
  slug: string;
  title: string;
  description: string;
  images: string[]; // fallback product-level
  price: number; // base price in cents
  variants: DetailedVariant[];
}

export async function fetchPrintfulProductDetail(
  productId: number
): Promise<RawPrintfulProduct> {
  const res = await callPrintful(`/sync/products/${productId}`);
  const syncProduct = (res as any).sync_product;
  const syncVariants: any[] = Array.isArray((res as any).sync_variants) ? (res as any).sync_variants : [];

  // Helper to fetch full files for a variant (to get all previews/mockups)
  async function fetchVariantFiles(variantId: number): Promise<RawPrintfulFile[]> {
    try {
      const detail = await callPrintful(`/sync/variant/${variantId}`);
      const files: any[] = Array.isArray((detail as any)?.files) ? (detail as any).files : [];
      // Only treat preview/mockup images as display assets on the product page.
      // Ignore raw design archive URLs.
      const mapped = files
        .filter((f: any) => !!(f?.preview_url || f?.thumbnail_url))
        .map((f: any) => ({
          src: (f.preview_url || f.thumbnail_url) as string,
          type: (f.type as string | undefined) || undefined,
          placement: (f.options?.placement || f.placement) as string | undefined,
        }));
      return mapped;
    } catch {
      return [];
    }
  }

  // Helper to fetch catalog variant details (color/size) when missing
  async function fetchCatalogVariant(variantId: number): Promise<{ color?: string; size?: string }> {
    try {
      const res = await callPrintful(`/products/variant/${variantId}`);
      const v = (res as any)?.variant || {};
      return { color: v.color, size: v.size };
    } catch {
      return {};
    }
  }

  // Enrich each variant with its full files list
  const variantsEnriched = await Promise.all(
    syncVariants.map(async (v: any) => {
      const vid = v.variant_id ?? v.id;
      const inlineFiles: RawPrintfulFile[] = Array.isArray(v.files)
        ? v.files
            // Keep only preview or thumbnail image links; skip raw file URLs
            .filter((f: any) => !!(f?.preview_url || f?.thumbnail_url))
            .map((f: any) => ({
              src: (f.preview_url || f.thumbnail_url) as string,
              type: (f.type as string | undefined) || undefined,
            }))
        : [];
      const extraFiles = await fetchVariantFiles(Number(vid));
      const all = [...inlineFiles, ...extraFiles];
      // Deduplicate by URL and maintain order
      const seen = new Set<string>();
      const unique: RawPrintfulFile[] = [];
      for (const f of all) {
        if (!f?.src || seen.has(f.src)) continue;
        seen.add(f.src);
        unique.push(f);
      }
      // fill catalog color/size if missing
      let color: string | undefined = v.color;
      let size: string | undefined = v.size;
      if (!color || !size) {
        const cat = await fetchCatalogVariant(Number(vid));
        color = color || cat.color;
        size = size || cat.size;
      }

      return {
        id: vid,
        price: Number(v.retail_price ?? 0),
        title: v.name,
        color,
        size,
        files: unique,
      } as RawPrintfulVariant;
    })
  );

  return {
    id: syncProduct.id,
    title: syncProduct.name,
    description: "",
    images: syncProduct.thumbnail_url ? [{ src: syncProduct.thumbnail_url }] : [],
    variants: variantsEnriched,
  };
}

export function mapToDetail(
  slug: string,
  raw: RawPrintfulProduct
): DetailedProduct {
  const images = Array.isArray(raw.images) ? raw.images.map((i: RawPrintfulFile) => i.src) : [];
  const variants: DetailedVariant[] = raw.variants.map((v: RawPrintfulVariant) => {
    const parts = (v.name || v.title || "").split("/").map((s: string) => s.trim());
    const color = v.color || parts[0] || "Default";
    const size = v.size || parts[1] || "One Size";
    // Build design URLs prioritizing preview/mockup files, then any available files, then product-level images
    const designUrls = Array.isArray(v.files) && v.files.length > 0
      ? v.files.map((f: RawPrintfulFile) => f.src)
      : images.length
        ? [images[0]]
        : ["/placeholder.png"];
    return {
      id: v.id,
      price: Math.round(Number(v.price) * 100) || 0,
      color,
      size,
      designUrls,
    };
  });
  return {
    printfulProductId: raw.id,
    slug,
    title: String(raw.title),
    description: String(raw.description || ""),
    images,
    price: variants[0]?.price || 0,
    variants,
  };
}

// ---- Orders ----
export type Recipient = {
  name: string
  address1: string
  address2?: string
  city: string
  state_code?: string
  country_code: string
  zip: string
  email?: string
  phone?: string
}

export async function createPrintfulOrder(body: {
  external_id?: string
  recipient: Recipient
  items: Array<{
    variant_id: number
    quantity: number
    retail_price?: string
    files?: Array<{ type?: string; url: string }>
    options?: Array<{ id: string; value: string | boolean }>
  }>
  confirm?: boolean
}) {
  const confirm = body.confirm !== false
  const result = await callPrintful(`/orders?confirm=${confirm ? "true" : "false"}`, {
    method: "POST",
    body: JSON.stringify({
      external_id: body.external_id,
      recipient: body.recipient,
      items: body.items,
    }),
  })
  return result
}

export async function createPrintfulOrderForLocalOrder(orderId: number, recipient: Recipient) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error(`Order ${orderId} not found`)
  const items = Array.isArray(order.items) ? (order.items as any[]) : []
  const outItems: Array<{
    variant_id: number
    quantity: number
    retail_price?: string
    files?: Array<{ type?: string; url: string }>
  }> = []

  // Helper to get printable files for a Printful catalog variant
  async function fetchVariantPrintFiles(variantId: number): Promise<Array<{ type?: string; url: string }>> {
    try {
      const detail = await callPrintful(`/sync/variant/${variantId}`)
      const files: any[] = Array.isArray((detail as any)?.files) ? (detail as any).files : []
      return files
        .filter((f: any) => !!f?.url) // design archives have raw URL
        .filter((f: any) => !String(f?.type || '').toLowerCase().includes('preview')) // skip previews
        .map((f: any) => ({ type: f.type as string | undefined, url: String(f.url) }))
    } catch {
      return []
    }
  }

  for (const it of items) {
    const variantId: number | null = it.variantId ?? null
    if (!variantId) continue
    const variant = await prisma.variant.findUnique({ where: { id: Number(variantId) } })
    if (!variant) continue
    const catalogVariantId = Number(variant.printfulVariantId)
    // Prefer real print files from Printful over stored preview/mockups
    let files: Array<{ type?: string; url: string }> = await fetchVariantPrintFiles(catalogVariantId)
    if (!files.length) {
      // Fallback: attempt to use stored URLs if any (may be mockups; not ideal)
      files = Array.isArray(variant.designUrls)
        ? (variant.designUrls as unknown as string[]).map((u) => ({ url: u }))
        : []
    }
    outItems.push({
      variant_id: catalogVariantId,
      quantity: Number(it.quantity) || 1,
      retail_price: ((Number(it.unitPriceCents) || 0) / 100).toFixed(2),
      files,
    })
  }

  if (!outItems.length) throw new Error(`Order ${orderId} has no printable items`)
  return await createPrintfulOrder({
    external_id: String(orderId),
    recipient,
    items: outItems,
    confirm: true,
  })
}
