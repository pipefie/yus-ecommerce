#!/usr/bin/env ts-node

import 'dotenv/config'
import slugify from 'slugify'
import { PrismaClient } from '../src/generated/prisma/index.js'  // ← your generated client

const prisma    = new PrismaClient()
const SHOP_ID   = process.env.PRINTIFY_SHOP_ID!
const API_TOKEN = process.env.PRINTIFY_API_KEY!

async function fetchAllProducts(): Promise<any[]> {
  let page = 1
  const out: any[] = []

  while (true) {
    const url = `https://api.printify.com/v1/shops/${SHOP_ID}/products.json?page=${page}&limit=50`
    console.log('📦 GET', url)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    })
    if (!res.ok) throw new Error(`fetch page ${page}: ${res.status}`)
    const json = (await res.json()) as any
    const items: any[] = Array.isArray(json) ? json : json.data ?? []
    console.log(`✅ fetched ${items.length} products`)
    if (items.length === 0) break
    out.push(...items)
    page++
  }

  return out
}

async function fetchDetail(id: number): Promise<any> {
  const url = `https://api.printify.com/v1/shops/${SHOP_ID}/products/${id}.json`
  console.log('🖼 GET', url)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  })
  if (!res.ok) throw new Error(`fetch detail ${id}: ${res.status}`)
  const json = (await res.json()) as any
  return json.data ?? json
}

async function main() {
  const products = await fetchAllProducts()

  for (const p of products) {
    const detail      = await fetchDetail(p.id)
    const rawImages   = Array.isArray(detail.images) ? detail.images : []
    const prodUrls    = rawImages.map((img: any) => img.src as string)
    const variantsRaw = Array.isArray(detail.variants) ? detail.variants : []
    const basePrice   =
      variantsRaw.reduce(
        (min: number, v: any) => Math.min(min, Number(v.price) || min),
        Infinity
      ) || 0

    const slug = slugify(detail.title, { lower: true, strict: true })

    // upsert Product
    await prisma.product.upsert({
      where: { printifyId: String(p.id) },
      update: {
        title:       detail.title,
        description: detail.description,
        price:       basePrice,
        imageUrl:    prodUrls[0] ?? '',
        images:      prodUrls,
        slug,
      },
      create: {
        printifyId:  String(p.id),
        slug,
        title:       detail.title,
        description: detail.description,
        price:       basePrice,
        imageUrl:    prodUrls[0] ?? '',
        images:      prodUrls,
      },
    })

    interface RawVariant {
      id: number;
      is_enabled: boolean;
    }

    interface RawImage {
      variant_ids?: number[];
      src: string;
    }   

    const filtered = variantsRaw.filter((v: RawVariant) =>
      // keep only enabled variants that have mockups
      v.is_enabled && rawImages.some((img: RawImage) =>
        Array.isArray(img.variant_ids) && img.variant_ids.includes(v.id))
    );
    // upsert Variants
    for (const v of filtered) {
      const thisImgs = rawImages
        .filter((img: RawImage) =>
          Array.isArray(img.variant_ids) && img.variant_ids.includes(v.id)
        )
        .map((img: RawImage) => img.src)

      const [color = 'Default', size = 'One Size'] =
        (v.title || '').split('/').map((s: string) => s.trim())

      await prisma.variant.upsert({
        where: { printifyId: String(v.id) },
        update: {
          price:      Number(v.price),
          color,
          size,
          imageUrl:   thisImgs[0] ?? '',
          previewUrl: thisImgs[0] ?? '',
          designUrls: thisImgs,
        },
        create: {
          printifyId: String(v.id),
          product:    { connect: { printifyId: String(p.id) } },
          price:      Number(v.price),
          color,
          size,
          imageUrl:   thisImgs[0] ?? '',
          previewUrl: thisImgs[0] ?? '',
          designUrls: thisImgs,
        },
      })
    }

    console.log(`🔄 Synced: ${detail.title}`)
  }

  console.log('🎉 Done')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
