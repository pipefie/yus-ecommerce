import slugify from "slugify"

// Base URL & API key for Printful
export const BASE = "https://api.printful.com"
export const KEY  = process.env.PRINTFUL_API_KEY!
export const STORE_ID = process.env.PRINTFUL_STORE_ID!

// Low-level helper to call Printful
async function callPrintful(path: string) {
  const headers: Record<string,string> = {
    Authorization: `Bearer ${KEY}`,
    "Content-Type":  "application/json",
    "X-PF-Store-Id":  STORE_ID,           // <<< must send your store id
  }

  const res = await fetch(`${BASE}${path}`, { headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`Printful ${path} error ${res.status}: ${JSON.stringify(body)}`)
  }
  return res.json()
}


export interface PFVariant {
  id: number
  price: number       // in cents
  size?:  string
  color?: string
  imageUrl: string      // Printful’s “image” URL
  previewUrl?: string   // the mockup file’s preview_url
}

export interface PrintfulProductFields {
  printfulId: number
  title: string
  slug: string
  description: string
  price:      number       // in cents
  imageUrl:   string
  variants: PFVariant[]
  images: string[]      // store‐side mockups, in the order you set in Printful
  nsfw: boolean
  updatedAt: Date
}


// Fetch all synced store products, fallback to full catalog
export async function fetchPrintfulProducts(): Promise<any[]> {
  // 1) Try store‐synced products
  const storeRes = await callPrintful("/store/products")
  const storeItems = Array.isArray(storeRes.result)
    ? storeRes.result.filter((p: any) => !p.is_ignored && (p.variants_count ?? p.variants) > 0)
    : []

  // 2) For each, hit the detail endpoint so we can read sync_variants
  const details = await Promise.all(
    storeItems.map(async (item: any) => {
      try {
        const detailRes = await callPrintful(`/store/products/${item.id}`)
        return detailRes.result
      } catch (err) {
        console.warn(`⚠️ Skipping store product ${item.id}:`, err)
        return null
      }
    })
  )

  // 3) Filter out any that failed or have no sync_variants
  return details.filter(
    (d): d is any =>
      d !== null &&
      Array.isArray(d.sync_variants) &&
      d.sync_variants.length > 0
  )
}

export function mapToLocal(pf: any): PrintfulProductFields {
  const title = pf.sync_product?.name ?? pf.name ?? pf.title ?? `#${pf.id}`

  // 1) All your store‐side mockups, in order:
  const images = Array.isArray(pf.images)
    ? pf.images.map((img: any) => img.url || img.preview_url).filter(Boolean)
    : []


  // 2) Build a PFVariant[] for every variant (sync or catalog)
  const rawVariants = pf.sync_variants ?? pf.variants ?? []
  if (!Array.isArray(rawVariants) || rawVariants.length === 0) {
    throw new Error(`Product ${pf.id} has no variants`)
  }
  const variants: PFVariant[] = rawVariants.map((v: any) =>  {
    // pick up mockup file URLs
    const file = Array.isArray(v.files) ? v.files[0] : null;
    const preview_url   = file?.preview_url;
    const thumbnail_url = file?.thumbnail_url;
    // primary mockup: preview first, then thumbnail
    const mockupUrl = preview_url || thumbnail_url || ""
    // fallback product image if no mockup
    const productImg = v.product?.image || v.image || ""

    return {
      id: v.variant_id ?? v.id,
      price: Math.round(Number(v.retail_price ?? v.price ?? "0") * 100),
      size: v.size,
      color: v.color,
      imageUrl: productImg || mockupUrl,
      previewUrl: preview_url || thumbnail_url || "",
    };
  });

  

  if (!variants.length) {
    throw new Error(`Product ${pf.id} has no variants`)
  }
  const defaultVariant = variants[0]
  const price    = defaultVariant.price
  const imageUrl =  images[0] || defaultVariant.imageUrl|| defaultVariant.previewUrl || ""


  return {
    printfulId: pf.sync_product?.id ?? pf.id,
    title,
    slug:        slugify(title, { lower: true }),
    description: pf.sync_product?.name ?? pf.description ?? "",
    price,           
    imageUrl,  
    images,
    variants,
    nsfw:        false,
    updatedAt:   new Date(
                  pf.sync_product?.updated
                  ?? pf.sync_product?.created
                  ?? pf.updated
                  ?? Date.now()
                ),
  }
}

