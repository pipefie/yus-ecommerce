#!/usr/bin/env ts-node

import 'dotenv/config'
import slugify from 'slugify'
import { PrismaClient } from '@prisma/client'

const prisma    = new PrismaClient()
const STORE_ID  = process.env.PRINTFUL_STORE_ID || ''
const API_TOKEN = process.env.PRINTFUL_TOKEN || process.env.PRINTFUL_API_KEY || ''

async function fetchAllProducts(): Promise<any[]> {
  let page = 1
  const out: any[] = []

  for (;;) {
    const url = `https://api.printful.com/sync/products?offset=${(page-1)*50}&limit=50`
    console.log('GET', url)
    const headers: Record<string, string> = { Authorization: `Bearer ${API_TOKEN}` }
    if (STORE_ID) headers['X-PF-Store-Id'] = STORE_ID
    const res = await fetch(url, { headers })
    const json = (await res.json()) as any
    if (!res.ok) throw new Error(`fetch page ${page}: ${res.status} ${(json?.result)||''}`)
    const items: any[] = Array.isArray(json?.result) ? json.result : []
    console.log(`fetched ${items.length} products`)
    if (!items.length) break
    out.push(...items)
    page++
  }

  return out
}

async function fetchDetail(id: number): Promise<any> {
  const url = `https://api.printful.com/sync/products/${id}`
  console.log('GET', url)
  const headers: Record<string, string> = { Authorization: `Bearer ${API_TOKEN}` }
  if (STORE_ID) headers['X-PF-Store-Id'] = STORE_ID
  const res = await fetch(url, { headers })
  const json = (await res.json()) as any
  if (!res.ok) throw new Error(`fetch detail ${id}: ${res.status} ${(json?.result)||''}`)
  return json.result ?? json
}

async function fetchVariantFiles(variantId: number): Promise<{ url: string; type?: string; placement?: string }[]> {
  const url = `https://api.printful.com/sync/variant/${variantId}`
  console.log('GET', url)
  const headers: Record<string, string> = { Authorization: `Bearer ${API_TOKEN}` }
  if (STORE_ID) headers['X-PF-Store-Id'] = STORE_ID
  const res = await fetch(url, { headers })
  const json = (await res.json()) as any
  if (!res.ok) {
    console.warn(`fetch variant ${variantId}: ${res.status} ${(json?.result)||''}`)
    return []
  }
  const files: any[] = Array.isArray(json?.result?.files) ? json.result.files : []
  const mapped = files
    .filter((f: any) => !!(f?.preview_url || f?.thumbnail_url || f?.url))
    .map((f: any) => ({
      url: String(f.preview_url || f.thumbnail_url || f.url),
      type: f.type ? String(f.type) : undefined,
      placement: (f.options?.placement || f.placement) ? String(f.options?.placement || f.placement) : undefined,
    }))
  const previews = mapped.filter(f => (f.type || '').toLowerCase().includes('preview'))
  return previews.length ? previews : mapped
}

async function fetchCatalogVariant(variantId: number): Promise<{ color?: string; size?: string; productId?: number }> {
  const url = `https://api.printful.com/products/variant/${variantId}`
  console.log('GET', url)
  const headers: Record<string, string> = { Authorization: `Bearer ${API_TOKEN}` }
  if (STORE_ID) headers['X-PF-Store-Id'] = STORE_ID
  const res = await fetch(url, { headers })
  const json = (await res.json()) as any
  if (!res.ok) {
    console.warn(`fetch catalog variant ${variantId}: ${res.status} ${(json?.result)||''}`)
    return {}
  }
  const v = json?.result?.variant || {}
  const p = json?.result?.product || {}
  return { color: v.color, size: v.size, productId: p.id }
}

async function main() {
  if (!API_TOKEN) throw new Error('Missing PRINTFUL_TOKEN (or PRINTFUL_API_KEY)')
  const products = await fetchAllProducts()

  for (const p of products) {
    const detail      = await fetchDetail(p.id)
    const sp          = detail.sync_product
    const variantsRaw = Array.isArray(detail.sync_variants) ? detail.sync_variants : []
    const prodUrls    = sp?.thumbnail_url ? [sp.thumbnail_url] : []
    const basePrice   =
      variantsRaw.reduce(
        (min: number, v: any) => Math.min(min, Math.round(Number(v.retail_price) * 100) || min),
        Infinity
      ) || 0

    const slug = slugify(sp.name, { lower: true, strict: true })

    await prisma.product.upsert({
      where: { printfulProductId: String(p.id) },
      update: {
        title:       sp.name,
        description: '',
        price:       basePrice,
        imageUrl:    prodUrls[0] ?? '',
        images:      prodUrls,
        slug,
        deleted:     false,
      },
      create: {
        printfulProductId:  String(p.id),
        slug,
        title:       sp.name,
        description: '',
        price:       basePrice,
        imageUrl:    prodUrls[0] ?? '',
        images:      prodUrls,
      },
    })

    for (const v of variantsRaw) {
      // Inline files from product detail
      const inline = Array.isArray(v.files)
        ? v.files
            .map((f: any) => f?.preview_url || f?.thumbnail_url || f?.url)
            .filter((u: any) => !!u)
        : []
      // Extra files by fetching full variant (often includes preview/mockups for front/back)
      const variantCatalogId = Number((v as any).variant_id ?? v.id)
      const extra = await fetchVariantFiles(variantCatalogId)
      const extraUrls = extra.map((f) => f.url)
      const thisImgs = [...inline, ...extraUrls]
      // Deduplicate while preserving order
      const dedup: string[] = []
      const seen = new Set<string>()
      for (const u of thisImgs) { if (u && !seen.has(u)) { seen.add(u); dedup.push(u) } }
      const [fallbackColor = 'Default', fallbackSize = 'One Size'] = (v.name || '').split('/').map((s: string) => s.trim())
      let color = (v as any).color || fallbackColor
      let size  = (v as any).size  || fallbackSize
      if (!((v as any).color) || !((v as any).size)) {
        const cat = await fetchCatalogVariant(variantCatalogId)
        color = color || cat.color || fallbackColor
        size  = size  || cat.size  || fallbackSize
      }
      const designUrls = (dedup.length ? dedup : prodUrls)

      await prisma.variant.upsert({
        where: { printfulVariantId: String((v as any).variant_id ?? v.id) },
        update: {
          product:    { connect: { printfulProductId: String(p.id) } },
          price:      Math.round(Number(v.retail_price) * 100) || 0,
          color,
          size,
          imageUrl:   designUrls[0] ?? '',
          previewUrl: designUrls.find(u => u) ?? '',
          designUrls: designUrls,
          deleted:    false,
        },
        create: {
          printfulVariantId: String((v as any).variant_id ?? v.id),
          product:    { connect: { printfulProductId: String(p.id) } },
          price:      Math.round(Number(v.retail_price) * 100) || 0,
          color,
          size,
          imageUrl:   designUrls[0] ?? '',
          previewUrl: designUrls.find(u => u) ?? '',
          designUrls: designUrls,
        },
      })
    }

    console.log(`Synced: ${sp.name}`)
  }

  console.log('Done')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
