// src/app/api/products/route.ts
import { NextResponse } from 'next/server'
import { getAllProducts } from '../../../lib/products'

// Edge cache results so subsequent requests reuse the same DB snapshot
export const revalidate = 60

export async function GET() {
  // 1) load from your SQLite DB via Prisma
  const raws = await getAllProducts()

  // 2) shape exactly what ShopClient/ProductCard need
  const payload = raws.map((p) => {
    const v = p.variants[0]! // default variant
    const imageUrl =
      Array.isArray(p.images) && p.images.length
        ? p.images[0]
        : p.imageUrl || '/placeholder.png'

    return {
      slug:        p.slug,
      title:       p.title,
      description: p.description,
      price:       v.price,
      imageUrl,
    }
  })

  return NextResponse.json(payload)
}
