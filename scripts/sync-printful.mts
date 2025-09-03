#!/usr/bin/env ts-node

import 'dotenv/config'
import slugify from 'slugify'
import { PrismaClient } from '@prisma/client'

const prisma    = new PrismaClient()
const STORE_ID  = process.env.PRINTFUL_STORE_ID!
const API_TOKEN = process.env.PRINTFUL_API_KEY!

async function fetchAllProducts(): Promise<any[]> {
  let page = 1
  const out: any[] = []

  while (true) {
    const url = `https://api.printful.com/stores/${STORE_ID}/products?page=${page}&limit=50`
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
  const url = `https://api.printful.com/stores/${STORE_ID}/products/${id}`
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

    await prisma.product.upsert({
      where: { printfulProductId: String(p.id) },
      update: {
        title:       detail.title,
        description: detail.description,
        price:       basePrice,
        imageUrl:    prodUrls[0] ?? '',
        images:      prodUrls,
        slug,
        deleted:     false,
      },
      create: {
        printfulProductId:  String(p.id),
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
      is_enabled?: boolean;
      price: number;
      title?: string;
    }

    interface RawImage {
      variant_ids?: number[];
      src: string;
    }

    const filtered = variantsRaw.filter((v: RawVariant) =>
      rawImages.some((img: RawImage) => Array.isArray(img.variant_ids) && img.variant_ids.includes(v.id))
    );

    for (const v of filtered) {
      const thisImgs = rawImages
        .filter((img: RawImage) => Array.isArray(img.variant_ids) && img.variant_ids.includes(v.id))
        .map((img: RawImage) => img.src)

      const [color = 'Default', size = 'One Size'] = (v.title || '').split('/').map((s: string) => s.trim())

      await prisma.variant.upsert({
        where: { printfulVariantId: String(v.id) },
        update: {
          product:    { connect: { printfulProductId: String(p.id) } },
          price:      Math.round(Number(v.price) || 0),
          color,
          size,
          imageUrl:   thisImgs[0] ?? '',
          previewUrl: thisImgs[0] ?? '',
          designUrls: thisImgs,
          deleted:    false,
        },
        create: {
          printfulVariantId: String(v.id),
          product:    { connect: { printfulProductId: String(p.id) } },
          price:      Math.round(Number(v.price) || 0),
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
