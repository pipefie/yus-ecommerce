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

async function fetchVariantFiles(syncVariantId: number, catalogVariantId: number): Promise<{ url: string; placement?: string }[]> {
  // 1) Prefer Sync Variant previews (design applied) using Sync Variant ID
  {
    const url = `https://api.printful.com/sync/variant/${syncVariantId}`
    console.log('GET', url)
    const headers: Record<string, string> = { Authorization: `Bearer ${API_TOKEN}` }
    if (STORE_ID) headers['X-PF-Store-Id'] = STORE_ID
    const res = await fetch(url, { headers })
    const json = (await res.json()) as any
    if (res.ok) {
      const files: any[] = Array.isArray(json?.result?.files) ? json.result.files : []
      const previews = files
        .filter((f: any) => !!(f?.preview_url || f?.thumbnail_url))
        .map((f: any) => ({ url: String(f.preview_url || f.thumbnail_url), placement: String(f.options?.placement || f.placement || '') }))
        .filter((f: any) => f.url && f.placement)
      if (previews.length) return previews
    } else {
      console.warn(`fetch variant ${variantId}: ${res.status} ${(json?.result)||''}`)
    }
  }
  // 2) Fallback to v2 Catalog blank mockups per placement using Catalog Variant ID
  {
    const url = `https://api.printful.com/v2/catalog-variants/${catalogVariantId}/images`
    console.log('GET', url)
    const headers: Record<string, string> = { Authorization: `Bearer ${API_TOKEN}` }
    if (STORE_ID) headers['X-PF-Store-Id'] = STORE_ID
    const res = await fetch(url, { headers })
    const json = (await res.json()) as any
    if (!res.ok) {
      console.warn(`fetch catalog-variant images ${variantId}: ${res.status} ${(json?.data)||''}`)
      return []
    }
    const imgs: any[] = Array.isArray(json?.data?.images) ? json.data.images : Array.isArray(json?.data) ? json.data : []
    return imgs
      .map((it: any) => ({ url: String(it.mockup_url || it.image_url || it.url || it.src || ''), placement: String(it.placement || it.view || it.side || '') }))
      .filter((it: any) => it.url && it.placement)
  }
}

async function fetchVariantProductImage(syncVariantId: number): Promise<string | null> {
  const url = `https://api.printful.com/sync/variant/${syncVariantId}`
  console.log('GET', url)
  const headers: Record<string, string> = { Authorization: `Bearer ${API_TOKEN}` }
  if (STORE_ID) headers['X-PF-Store-Id'] = STORE_ID
  const res = await fetch(url, { headers })
  const json = (await res.json()) as any
  if (!res.ok) return null
  const img = json?.result?.sync_variant?.product?.image
  return typeof img === 'string' && img ? img : null
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
      // Extra files by fetching full variant (often includes preview/mockups for front/back)
      const syncId = Number(v.id)
      const variantCatalogId = Number((v as any).variant_id ?? v.id)
      const extra = await fetchVariantFiles(syncId, variantCatalogId)
      const productImg = await fetchVariantProductImage(syncId)
      // Order by desired placements front,back,left,right then dedup
      const byPlacement: Record<string, string[]> = {}
      for (const it of extra) {
        if (!it.url || !it.placement) continue
        ;(byPlacement[it.placement.toLowerCase()] ||= []).push(it.url)
      }
      const order = ['front','back','left','right']
      const ordered: string[] = []
      for (const p of order) {
        const u = byPlacement[p]?.[0]
        if (u) ordered.push(u)
      }
      const merged = [productImg, ...ordered, ...prodUrls].filter((u): u is string => typeof u === 'string' && !!u)
      // Deduplicate while preserving order
      const thisImgs: string[] = []
      const seen = new Set<string>()
      for (const u of merged) { if (!seen.has(u)) { seen.add(u); thisImgs.push(u) } }
      // Already deduped; retain
      const dedup: string[] = thisImgs
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
