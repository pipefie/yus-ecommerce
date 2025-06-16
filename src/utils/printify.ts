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
  return res.json();
}

export interface SummaryProduct {
  printifyId: number;
  slug:       string;
  title:      string;
  description:string;
  price:      number;
  thumbnail:  string;
}

export async function fetchPrintifyProducts(): Promise<any[]> {
  const { data } = await callPrintify(`/shops/${SHOPID}/products.json`);
  return data;
}

export function mapToSummary(p: any): SummaryProduct {
  const firstImage = Array.isArray(p.images) ? p.images[0]?.src : "";
  const firstVariant = Array.isArray(p.variants) ? p.variants[0] : { price: 0 };
  return {
    printifyId: p.id,
    slug:       slugify(p.title || `#${p.id}`, { lower: true }),
    title:      p.title,
    description:p.description || "",
    price:      Math.round(firstVariant.price || 0),
    thumbnail:  firstImage,
  };
}

export async function fetchPrintifyProductDetail(productId: number) {
  const json = await callPrintify(`/shops/${SHOPID}/products/${productId}.json`);
  return (json.data ?? json) as any;
}

export interface DetailedVariant {
  id:        number;
  price:     number;
  color:     string;
  size:      string;
  designUrl: string[];  // <<< our carousel images
}

export interface DetailedProduct {
  printifyId: number;
  slug:       string;
  title:      string;
  description:string;
  variants:   DetailedVariant[];
  images:     string[];
  price:      number;
}

export function mapToDetail(slug: string, raw: any): DetailedProduct {
  // fallback product‐level images
  const images = Array.isArray(raw.images)
    ? raw.images.map((i: any) => i.src)
    : [];

  // map each variant: title is "Color / Size"
  const variants: DetailedVariant[] = raw.variants.map((v: any) => {
    const [color = "Default", size = "One Size"] =
      (v.title || "").split("/").map((s: string) => s.trim());

    // v.files is an array of mockup previews Printify returns for each print area
    const urls = Array.isArray(v.files) && v.files.length > 0
      ? v.files.map((f: any) => f.src)
      : images.length > 0
        ? [images[0]]
        : ["/placeholder.png"];

    return {
      id:        v.id,
      price:     Math.round(v.price || 0),
      color,
      size,
      designUrl: urls,
    };
  });

  return {
    printifyId: raw.id,
    slug,
    title:      raw.title,
    description:raw.description || "",
    variants,
    images,
    price: variants[0]?.price || 0,
  };
}
