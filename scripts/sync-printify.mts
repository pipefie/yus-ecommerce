#!/usr/bin/env node
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

const SHOP_ID = process.env.PRINTIFY_SHOP_ID!
const API_TOKEN = process.env.PRINTIFY_API_KEY!

// --- helper to fetch & paginate ---
async function fetchAllProducts(): Promise<any[]> {
  let page = 1
  const out: any[] = []

  while (true) {
    const url = `https://api.printify.com/v1/shops/${SHOP_ID}/products.json?page=${page}&limit=50`
    console.log('📦 GET', url)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    })
    if (!res.ok) {
      throw new Error(`Error fetching products page ${page}: ${res.status}`)
    }
    // cast to any so TS stops complaining
    const json = (await res.json()) as any

    // Printify v1 returns the array of products at the root
    const items = Array.isArray(json) ? json : json.data ?? json.products ?? []
    console.log(`✅ fetched ${items.length} products`)
    if (items.length === 0) break

    out.push(...items)
    page++
  }

  return out
}

// --- fetch a single product’s detail ---
async function fetchProductDetail(id: number): Promise<any> {
  const url = `https://api.printify.com/v1/shops/${SHOP_ID}/products/${id}.json`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  })
  if (!res.ok) {
    throw new Error(`Error fetching product ${id}: ${res.status}`)
  }
  return (await res.json()) as any
}

// --- main sync ---
async function main() {
  const products = await fetchAllProducts()

  for (const p of products) {
    const detail = await fetchProductDetail(p.id)

    // pull out variants & images
    const variants: any[] = detail.variants ?? []
    const images: { src: string; variant_ids: number[]; is_default: boolean }[] =
      detail.images ?? []

    // compute basePrice = lowest variant price
    const basePrice =
      variants.reduce(
        (min: number, v: any) => Math.min(min, Number(v.price)),
        Infinity
      ) || 0

    // product-level images (just store the srcs)
    const prodImageUrls = images.map((i) => i.src)

    // upsert product
    await prisma.product.upsert({
      where: { printifyId: String(p.id) },
      update: {
        title: detail.title,
        description: detail.description,
        price: basePrice,
        imageUrl: prodImageUrls[0] ?? '',
        images: prodImageUrls
      },
      create: {
        printifyId: String(p.id),
        slug: detail.title.replace(/\s+/g, '-').toLowerCase(),
        title: detail.title,
        description: detail.description,
        price: basePrice,
        imageUrl: prodImageUrls[0] ?? '',
        images: prodImageUrls
      }
    })

    // upsert each variant
    for (const v of variants) {
      // pick out just the mockups for this variant id
      const thisVariantImages = images
        .filter((i) => i.variant_ids.includes(v.id))
        .map((i) => i.src)

      await prisma.variant.upsert({
        where: { printifyId: String(v.id) },
        update: {
          price: Number(v.price),
          color: v.title,
          size: v.title,
          imageUrl: thisVariantImages[0] ?? '',
          previewUrl: thisVariantImages[0] ?? '',
          designUrls: thisVariantImages
        },
        create: {
          printifyId: String(v.id),
          // connect back to the product we just upserted
          product: { connect: { printifyId: String(p.id) } },
          price: Number(v.price),
          color: v.title,
          size: v.title,
          imageUrl: thisVariantImages[0] ?? '',
          previewUrl: thisVariantImages[0] ?? '',
          designUrls: thisVariantImages
        }
      })
    }

    console.log(`🔄 Synced product ${detail.title} (${p.id})`)
  }

  console.log('🎉 Sync complete')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
