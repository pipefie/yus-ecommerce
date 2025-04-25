import slugify from "slugify"

// Base URL & API key for Printful
export const BASE = "https://api.printful.com"
export const KEY  = process.env.PRINTFUL_API_KEY!

// Fields we store in MongoDB
export interface PrintfulProductFields {
  printfulId: number
  printfulVariantId: number
  title: string
  slug: string
  description: string
  price: number       // in cents
  imageUrl: string
  nsfw: boolean
  updatedAt: Date
}

// Low-level helper to call Printful
async function callPrintful(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`Printful ${path} error ${res.status}: ${JSON.stringify(body)}`)
  }
  return res.json()
}

// Fetch all synced store products, fallback to full catalog
export async function fetchPrintfulProducts(): Promise<any[]> {
  // Try store-synced products
  const store = await callPrintful("/store/products")
  if (Array.isArray(store.result) && store.result.length > 0) {
    return store.result
  }

  // Fallback to full catalog
  const catalog = await callPrintful("/products")
  if (!Array.isArray(catalog.result)) {
    throw new Error("Unexpected catalog format")
  }
  return catalog.result
}

// Map Printful's API product shape into our MongoDB fields
export function mapToLocal(pf: any): PrintfulProductFields {
  const variant = pf.variants?.[0]
  if (!variant) throw new Error(`No variants for product ${pf.id}`)
  return {
    printfulId:        pf.id,
    printfulVariantId: variant.id,
    title:             pf.name || pf.title,
    slug:              slugify(pf.name || pf.title, { lower: true }),
    description:       pf.description ?? "",
    price:             Math.round(Number(variant.price) * 100),
    imageUrl:          pf.images?.[0]?.url ?? variant.image,
    nsfw:              false,
    updatedAt:         new Date(pf.sync_product?.updated ?? Date.now()),
  }
}
