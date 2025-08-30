#!/usr/bin/env ts-node

import 'dotenv/config'
import slugify from 'slugify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_KEY = process.env.PRINTFUL_API_KEY!

const API_BASE = 'https://api.printful.com'

async function listProducts(): Promise<any[]> {
  let offset = 0
  const limit = 100
  const all: any[] = []

  while (true) {
    const url = `${API_BASE}/store/products?offset=${offset}&limit=${limit}`
    console.log('📦 GET', url)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })
    if (!res.ok) throw new Error(`listProducts ${res.status}`)
    const json = await res.json()
    const items: any[] = json.result ?? []
    console.log(`✅ fetched ${items.length} products`)
    if (items.length === 0) break
    all.push(...items)
    offset += limit
    const total: number = json.paging?.total ?? all.length
    if (offset >= total) break
  }
  return all
}

async function getProduct(id: number): Promise<any> {
  const url = `${API_BASE}/store/products/${id}`
  console.log('🖼 GET', url)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })
  if (!res.ok) throw new Error(`getProduct ${res.status}`)
  const json = await res.json()
  return json.result ?? json
}

async function main() {
  const products = await listProducts()
  const seenProducts: string[] = []
  const seenVariants: string[] = []

  for (const p of products) {
    const detail = await getProduct(p.id)
    const prod = detail.sync_product
    const variants = Array.isArray(detail.sync_variants) ? detail.sync_variants : []
    const slug = slugify(prod.name, { lower: true, strict: true })
    const images = prod.thumbnail ? [prod.thumbnail] : []
    const basePrice =
      variants.reduce(
        (min: number, v: any) => Math.min(min, Number(v.retail_price) || min),
        Infinity
      ) || 0

    await prisma.product.upsert({
      where: { printifyId: String(prod.id) },
      update: {
        slug,
        title: prod.name,
        description: prod.description || '',
        price: basePrice,
        imageUrl: images[0] ?? '',
        images,
        deleted: false,
      },
      create: {
        printifyId: String(prod.id),
        slug,
        title: prod.name,
        description: prod.description || '',
        price: basePrice,
        imageUrl: images[0] ?? '',
        images,
      },
    })
    seenProducts.push(String(prod.id))

    for (const v of variants) {
      const designUrls: string[] = (Array.isArray(v.files) ? v.files : [])
        .map((f: any) => f.preview_url || f.thumbnail_url)
        .filter(Boolean)
      const image = designUrls[0] ?? ''
      const color = v.color || ''
      const size = v.size || ''

      await prisma.variant.upsert({
        where: { printifyId: String(v.id) },
        update: {
          product: { connect: { printifyId: String(prod.id) } },
          price: Number(v.retail_price) || 0,
          color,
          size,
          imageUrl: image,
          previewUrl: image,
          designUrls,
          deleted: false,
        },
        create: {
          printifyId: String(v.id),
          product: { connect: { printifyId: String(prod.id) } },
          price: Number(v.retail_price) || 0,
          color,
          size,
          imageUrl: image,
          previewUrl: image,
          designUrls,
        },
      })
      seenVariants.push(String(v.id))
    }
    console.log(`🔄 Synced: ${prod.name}`)
  }

  // Soft-delete products/variants missing from Printful
  await prisma.variant.updateMany({
    where: { printifyId: { notIn: seenVariants } },
    data: { deleted: true },
  })
  await prisma.product.updateMany({
    where: { printifyId: { notIn: seenProducts } },
    data: { deleted: true },
  })

  console.log('🎉 Done')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
