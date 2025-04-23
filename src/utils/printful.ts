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

// Fetch all synced store products from Printful
export async function fetchPrintfulProducts(): Promise<any[]> {
  const res = await fetch(`${BASE}/store/products`, {
    headers: { Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error("Failed to fetch Printful products")
  const { result } = await res.json()
  return result
}

// Map Printful's shape into our Mongo fields
export function mapToLocal(pf: any): PrintfulProductFields {
  const variant = pf.variants[0]
  return {
    printfulId:        pf.id,
    printfulVariantId: variant.id,
    title:             pf.name,
    slug:              slugify(pf.name, { lower: true }),
    description:       pf.description ?? "",
    price:             variant.price,
    imageUrl:          pf.images[0]?.url ?? "",
    nsfw:              false,
    updatedAt:         new Date(pf.sync_product.updated),
  }
}
