// src/utils/printify.ts

import slugify from "slugify";

const BASE    = "https://api.printify.com/v1";
const TOKEN   = process.env.PRINTIFY_API_KEY!;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID!;

// Low-level helper
async function callPrintify(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Printify ${path} error ${res.status}`);
  return res.json();
}

export interface PIVariant {
  id:       number;
  price:    number;     // in cents
  sku:      string;
  size?:    string;
  color?:   string;
  designUrl: string;
}

export interface PrintifyProduct {
  printifyId: number;
  slug:         string;
  title:        string;
  description:  string;
  price:        number;     // in cents, from first variant
  images:       string[];   // your design URLs
  variants:     PIVariant[];
}

// 1) Fetch all your shop’s products
export async function fetchPrintifyProducts(): Promise<any[]> {
  // paginated endpoint
  const json = await callPrintify(`/shops/${SHOP_ID}/products.json`);
// Printify wraps data in .data
  return Array.isArray(json.data) ? json.data : [];
}

// 2) map Printify’s shape into your storefront shape
export function mapToLocal(p: any): PrintifyProduct {
  // front/back images you set up on Printify dashboard
  const images = Array.isArray(p.images)
    ? p.images.map((i: any) => i.src).filter(Boolean)
    : [];

  const variants: PIVariant[] = Array.isArray(p.variants)
    ? p.variants.map((v: any) => {

        // Printify’s product JSON often has a `files` array with your design URLs:
        const designUrl = Array.isArray(v.files) && v.files[0]?.src
          ? v.files[0].src
          : p.images[0] || "/placeholder.png";   // fallback to product image
        
        return {

            id:       v.id,
            sku:      v.sku,
            price:    Math.round((v.price || 0)),
            size:     v.options?.size,
            color:    v.options?.color,
            designUrl
        };
      })
    : [];

  const defaultVar = variants[0];
  return {
    printifyId: p.id,
    slug:       slugify(p.title || `#${p.id}`, { lower: true }),
    title:      p.title,
    description:p.description || "",
    price:      defaultVar.price,
    images,
    variants,
  };
}
