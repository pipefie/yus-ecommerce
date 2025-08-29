// src/utils/printful.ts
import slugify from "slugify";

const BASE   = "https://api.printful.com";
const TOKEN  = process.env.PRINTFUL_API_KEY!;
const STOREID = process.env.PRINTFUL_STORE_ID!;

async function callPrintful(path: string, opts: RequestInit = {}) {
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
    throw new Error(`Printful ${path} → ${res.status}\n${text}`);
  }
  return (await res.json()).result;
}

/** Top‐level product summary for catalog pages */
export interface SummaryProduct {
  printfulProductId: number;
  slug:       string;
  title:      string;
  description:string;
  price:      number;   // in cents
  thumbnail:  string;
}

interface RawPrintfulFile {
  src: string
}

interface RawPrintfulVariant {
  id: number
  price: number
  title?: string
  files?: RawPrintfulFile[]
}

interface RawPrintfulProduct {
  id: number
  title?: string
  description?: string
  images?: RawPrintfulFile[]
  variants: RawPrintfulVariant[]
}

export async function fetchPrintfulProducts(): Promise<RawPrintfulProduct[]> {
  // Printful paginates at 50 max
  let page = 1;
  const all: RawPrintfulProduct[] = [];
  while (true) {
    const batch: RawPrintfulProduct[] = await callPrintful(
      `/stores/${STOREID}/products?page=${page}&limit=50`
    );
    if (!batch.length) break;
    all.push(...batch);
    page++;
  }
  return all;
}

export function mapToSummary(p: RawPrintfulProduct): SummaryProduct {
  const firstImage   = p.images?.[0]?.src || "/placeholder.png";
  const firstVariant = p.variants?.[0] || { price: 0 };
  return {
    printfulProductId: p.id,
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
  printfulProductId: number;
  slug:       string;
  title:      string;
  description:string;
  images:     string[];       // fallback product‐level
  price:      number;         // base price
  variants:   DetailedVariant[];
}

export async function fetchPrintfulProductDetail(
  productId: number
): Promise<RawPrintfulProduct> {
  return await callPrintful(`/stores/${STOREID}/products/${productId}`);
}

export function mapToDetail(
  slug: string,
  raw:  RawPrintfulProduct
): DetailedProduct {
  // fallback product‐level images
  const images = Array.isArray(raw.images)
    ? raw.images.map((i: RawPrintfulFile) => i.src)
    : [];

  const variants: DetailedVariant[] = raw.variants.map((v: RawPrintfulVariant) => {
    const [ color = "Default", size = "One Size" ] =
      (v.title || "").split("/").map((s:string)=>s.trim());

    // v.files are the mockup previews per print area
    const designUrls = Array.isArray(v.files) && v.files.length > 0
      ? v.files.map((f: RawPrintfulFile) => f.src)
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
    printfulProductId: raw.id,
    slug,
    title:      String(raw.title),
    description: String(raw.description || ""),
    images,
    price:      Math.round(variants[0]?.price || 0),
    variants,
  };
}
