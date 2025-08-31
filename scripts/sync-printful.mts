#!/usr/bin/env ts-node

import 'dotenv/config'
import slugify from 'slugify'
<<<<<<< HEAD
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
=======
import { PrismaClient } from '@prisma/client'  // ← your generated client

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

    // upsert Product
    await prisma.product.upsert({
      where: { printfulProductId: String(p.id) },
      update: {
        title:       detail.title,
        description: detail.description,
        price:       basePrice,
        imageUrl:    prodUrls[0] ?? '',
        images:      prodUrls,
        slug,
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
        where: { printfulVariantId: String(v.id) },
        update: {
          price:      Number(v.price),
          color,
          size,
          imageUrl:   thisImgs[0] ?? '',
          previewUrl: thisImgs[0] ?? '',
          designUrls: thisImgs,
        },
        create: {
          printfulVariantId: String(v.id),
          product:    { connect: { printfulProductId: String(p.id) } },
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
>>>>>>> 73c0bf685bdbd65723fa1b5bc4671c49a393520c

  console.log('🎉 Done')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
