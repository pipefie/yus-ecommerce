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
    const v = p.variants.find((vv) => Array.isArray(vv.designUrls) && vv.designUrls.length > 0) || p.variants[0] || null
    const imageUrl =
      (Array.isArray(p.images) && p.images.length)
        ? (p.images as unknown as string[])[0]
        : v?.previewUrl || v?.imageUrl || p.imageUrl || '/placeholder.png'
    const price = v?.price ?? p.price
    return {
      slug:        p.slug,
      title:       p.title,
      description: p.description,
      price,
      imageUrl,
    }
  })

  return NextResponse.json(payload)
}
