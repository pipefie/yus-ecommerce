// src/app/api/products/route.ts
import { NextResponse } from 'next/server'
import { getAllProducts } from '../../../lib/products'
import { getAssetUrls, assetPlaceholder } from '@/lib/assets'

export const revalidate = 60

export async function GET() {
  const raws = await getAllProducts()

  const payload = raws.map((p) => {
    const productLevelImages = getAssetUrls(
      p.productImages
        .filter((img) => !img.variantId)
        .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
        .map((img) => img.url),
      { fallback: assetPlaceholder() }
    )

    const primaryVariant = p.variants.find((v) => Number.isFinite(v.price)) ?? p.variants[0] ?? null
    const imageUrl = productLevelImages[0] ?? assetPlaceholder()
    const price = primaryVariant?.price ?? p.price

    return {
      slug: p.slug,
      title: p.title,
      description: p.description,
      price,
      imageUrl,
    }
  })

  return NextResponse.json(payload)
}
