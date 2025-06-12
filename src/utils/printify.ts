// src/utils/printify.ts
import slugify from "slugify";

const BASE   = "https://api.printify.com/v1";
const TOKEN  = process.env.PRINTIFY_API_KEY!;
const SHOPID = process.env.PRINTIFY_SHOP_ID!;

async function callPrintify(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type":  "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Printify ${path} error ${res.status}`);
  return res.json();
}

// 1) List summary for home/grid
export async function fetchPrintifyProducts() {
  const { data } = await callPrintify(`/shops/${SHOPID}/products.json`);
  return data as any[];
}

export interface SummaryProduct {
  printifyId: number;
  slug:       string;
  title:      string;
  description:string;
  price:      number;      // cents
  thumbnail:  string;      // first image
}

// map for home grid
export function mapToSummary(p: any): SummaryProduct {
  const firstImage = Array.isArray(p.images) ? p.images[0]?.src : "";
  const firstVariant = Array.isArray(p.variants) ? p.variants[0] : { price: 0 };
  return {
    printifyId: p.id,
    slug:       slugify(p.title || `#${p.id}`, { lower: true }),
    title:      p.title,
    description:p.description || "",
    price:      Math.round((firstVariant.price||0)),
    thumbnail:  firstImage,
  };
}

// 2) Fetch full detail (including per‐variant mockup files)
export async function fetchPrintifyProductDetail(productId: number) {
  const json = await callPrintify(`/shops/${SHOPID}/products/${productId}.json`);
  return (json.data ?? json) as any;
}

export interface DetailedVariant {
  id:        number;
  price:     number;    
  size?:     string;
  color?:    string;
  designUrl: string[];    // the mockup URL
}

export interface DetailedProduct {
  printifyId: number;
  slug:       string;
  title:      string;
  description:string;
  variants:   DetailedVariant[];
  images:     string[]; // product‐level images
  price:      number;   // cents (first variant)
}

export interface PFVariant {
  id:         number
  price:      number      // cents
  size?:      string
  color?:     string
  imageUrl:   string
  previewUrl?:string
}

// map for detail page
export function mapToDetail(slug: string, raw: any): DetailedProduct {
  const images = Array.isArray(raw.images) ? raw.images.map((i: any) => i.src) : [];

  const variants: DetailedVariant[] = Array.isArray(raw.variants)
    ? raw.variants.map((v: any) => ({
    id:        v.id,
    price:     Math.round((v.price||0)),
    size:      v.options?.size,
    color:     v.options?.color,
    designUrl: Array.isArray(v.files) 
      ? v.files.map((f: any) => f.src) 
      : images.length 
        ? [images[0]]
        : ["/placeholder.png"],
    }))
  : [];
  
  return {
    printifyId: raw.id,
    slug,
    title:      raw.title,
    description:raw.description || "",
    variants,
    images,
    price:      variants[0]?.price || 0,
  };
}

export interface PrintifyProductFields {
  printifyId: number
  title: string
  slug: string
  description: string
  price: number
  imageUrl: string
  variants: PFVariant[]
  images: string[]
  nsfw: boolean
  updatedAt: Date
}

export function mapToLocal(raw: any): PrintifyProductFields {
  const title = raw.title || `#${raw.id}`
  const slug = slugify(title, { lower: true })

  const images = Array.isArray(raw.images)
    ? raw.images.map((i: any) => i.src).filter(Boolean)
    : []

  const rawVariants = raw.variants || []
  if (!Array.isArray(rawVariants) || rawVariants.length === 0) {
    throw new Error(`Product ${raw.id} has no variants`)
  }

  const variants: PFVariant[] = rawVariants.map((v: any) => {
    const file = Array.isArray(v.files) ? v.files[0] : null
    const design = file?.src || images[0] || ""
    return {
      id: v.id,
      price: Math.round((v.price || 0) * 100),
      size: v.options?.size,
      color: v.options?.color,
      imageUrl: design,
      previewUrl: design,
    }
  })

  const defaultVariant = variants[0]
  const price = defaultVariant.price
  const imageUrl = images[0] || defaultVariant.previewUrl || defaultVariant.imageUrl || ""

  return {
    printifyId: raw.id,
    title,
    slug,
    description: raw.description || "",
    price,
    imageUrl,
    variants,
    images,
    nsfw: false,
    updatedAt: new Date(raw.updated_at || raw.created_at || Date.now()),
  }
}

