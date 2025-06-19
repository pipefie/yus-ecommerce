// src/utils/printify.ts
import slugify from "slugify";

const BASE   = "https://api.printify.com/v1";
const TOKEN  = process.env.PRINTIFY_API_KEY!;
const SHOPID = process.env.PRINTIFY_SHOP_ID!;

async function callPrintify(path: string, opts: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type":  "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify ${path} → ${res.status}\n${text}`);
  }
  return (await res.json()).data;
}

/** Top‐level product summary for catalog pages */
export interface SummaryProduct {
  printifyId: number;
  slug:       string;
  title:      string;
  description:string;
  price:      number;   // in cents
  thumbnail:  string;
}

interface RawPrintifyFile {
  src: string
}

interface RawPrintifyVariant {
  id: number
  price: number
  title?: string
  files?: RawPrintifyFile[]
}

interface RawPrintifyProduct {
  id: number
  title?: string
  description?: string
  images?: RawPrintifyFile[]
  variants: RawPrintifyVariant[]
}

export async function fetchPrintifyProducts(): Promise<RawPrintifyProduct[]> {
  // Printify paginates at 50 max
  let page = 1;
  const all: RawPrintifyProduct[] = [];
  while (true) {
    const batch: RawPrintifyProduct[] = await callPrintify(
      `/shops/${SHOPID}/products.json?page=${page}&limit=50`
    );
    if (!batch.length) break;
    all.push(...batch);
    page++;
  }
  return all;
}

export function mapToSummary(p: RawPrintifyProduct): SummaryProduct {
  const firstImage   = p.images?.[0]?.src || "/placeholder.png";
  const firstVariant = p.variants?.[0] || { price: 0 };
  return {
    printifyId: p.id,
    slug:       slugify(p.title || `#${p.id}`, { lower: true, strict: true }),
    title:      String(p.title),
    description:p.description || "",
    price:      Math.round(firstVariant.price),
    thumbnail:  firstImage,
  };
}

/** Full product detail for the detail page */
export interface DetailedVariant {
  id:         number;
  price:      number;
  color:      string;
  size:       string;
  designUrls: string[];   // all mockup URLs for this color/size
}

export interface DetailedProduct {
  printifyId: number;
  slug:       string;
  title:      string;
  description:string;
  images:     string[];       // fallback product‐level
  price:      number;         // base price
  variants:   DetailedVariant[];
}

export async function fetchPrintifyProductDetail(
  productId: number
): Promise<RawPrintifyProduct> {
  // callPrintify() returns the JSON body { data: { … } }
  const json = await callPrintify(`/shops/${SHOPID}/products/${productId}.json`);
  return json.data;       // ← unwrap here so raw.images exists
}

export function mapToDetail(
  slug: string,
  raw:  RawPrintifyProduct
): DetailedProduct {
  // fallback product‐level images
  const images = Array.isArray(raw.images)
    ? raw.images.map((i: RawPrintifyFile) => i.src)
    : [];

  const variants: DetailedVariant[] = raw.variants.map((v: RawPrintifyVariant) => {
    const [ color = "Default", size = "One Size" ] =
      (v.title || "").split("/").map((s:string)=>s.trim());

    // v.files are the mockup previews per print area
    const designUrls = Array.isArray(v.files) && v.files.length > 0
      ? v.files.map((f: RawPrintifyFile) => f.src)
      : images.length
        ? [images[0]]
        : ["/placeholder.png"];

    return {
      id:         v.id,
      price:      Math.round(v.price),
      color,
      size,
      designUrls,
    };
  });

  return {
    printifyId: raw.id,
    slug,
    title:      String(raw.title),
    description: String(raw.description || ""),
    images,
    price:      Math.round(variants[0]?.price || 0),
    variants,
  };
}
