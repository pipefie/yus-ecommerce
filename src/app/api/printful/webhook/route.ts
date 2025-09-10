import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import slugify from 'slugify'

const API_BASE = 'https://api.printful.com'
const API_KEY = process.env.PRINTFUL_TOKEN || process.env.PRINTFUL_API_KEY!
const STORE_ID = process.env.PRINTFUL_STORE_ID
const WEBHOOK_SECRET = process.env.PRINTFUL_WEBHOOK_SECRET!

interface PrintfulFile {
  preview_url?: string
  thumbnail_url?: string
}

interface PrintfulVariant {
  id: number
  retail_price?: string | number
  color?: string
  size?: string
  files?: PrintfulFile[]
}

async function fetchVariantMockups(variantId: number): Promise<string[]> {
  const headers: Record<string,string> = { Authorization: `Bearer ${API_KEY}` }
  if (STORE_ID) headers['X-PF-Store-Id'] = String(STORE_ID)
  try {
    // 1) Prefer Sync Variant previews with design applied
    const resSync = await fetch(`${API_BASE}/sync/variant/${variantId}`, { headers, cache: 'no-store' })
    const jsonSync = await resSync.json().catch(() => ({} as any))
    if (resSync.ok) {
      const files: any[] = Array.isArray(jsonSync?.result?.files) ? jsonSync.result.files : []
      const previews = files
        .filter((f: any) => !!(f?.preview_url || f?.thumbnail_url))
        .map((f: any) => ({
          url: String(f.preview_url || f.thumbnail_url),
          placement: String(f.options?.placement || f.placement || ''),
        }))
        .filter((x: any) => x.url)
      if (previews.length) {
        const byPlacement: Record<string, string[]> = {}
        for (const it of previews) {
          const p = it.placement.toLowerCase()
          ;(byPlacement[p] ||= []).push(it.url)
        }
        const order = ['front','back','left','right']
        const ordered: string[] = []
        for (const p of order) { const u = byPlacement[p]?.[0]; if (u) ordered.push(u) }
        return ordered.length ? ordered : previews.map(p => p.url)
      }
    }
    // 2) Fallback to v2 blank mockups
    const res = await fetch(`${API_BASE}/v2/catalog-variants/${variantId}/images`, { headers, cache: 'no-store' })
    const json = await res.json().catch(() => ({} as any))
    if (!res.ok) throw new Error(String(json?.data || json))
    const images: any[] = Array.isArray(json?.data?.images) ? json.data.images : Array.isArray(json?.data) ? json.data : []
    const byPlacement: Record<string, string[]> = {}
    for (const it of images) {
      const url = String(it.mockup_url || it.url || it.src || '')
      const placement = String(it.placement || it.view || it.side || '').toLowerCase()
      if (!url || !placement) continue
      ;(byPlacement[placement] ||= []).push(url)
    }
    const order = ['front','back','left','right']
    const ordered: string[] = []
    for (const p of order) {
      const u = byPlacement[p]?.[0]
      if (u) ordered.push(u)
    }
    return ordered.length ? ordered : Object.values(byPlacement).flat()
  } catch {
    return []
  }
}

async function fetchProduct(id: number) {
  const headers: Record<string,string> = { Authorization: `Bearer ${API_KEY}` }
  if (STORE_ID) headers['X-PF-Store-Id'] = String(STORE_ID)
  const res = await fetch(`${API_BASE}/sync/products/${id}`, { headers })
  if (!res.ok) throw new Error(`fetchProduct ${res.status}`)
  const json = await res.json()
  return json.result ?? json
}

async function upsertProduct(productId: number) {
  const detail = await fetchProduct(productId)
  const prod = detail.sync_product
  const variants: PrintfulVariant[] = Array.isArray(detail.sync_variants)
    ? detail.sync_variants
    : []
  const slug = slugify(prod.name, { lower: true, strict: true })
  const images = prod.thumbnail_url ? [prod.thumbnail_url] : []
  const basePrice =
    variants.reduce(
      (min: number, v: PrintfulVariant) =>
        Math.min(min, Number(v.retail_price) || min),
      Infinity
    ) || 0

  await prisma.product.upsert({
    where: { printfulProductId: String(prod.id) },
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
      printfulProductId: String(prod.id),
      slug,
      title: prod.name,
      description: prod.description || '',
      price: basePrice,
      imageUrl: images[0] ?? '',
      images,
    },
  })

  for (const v of variants) {
    const key = String((v as any).variant_id ?? v.id)
    // Prefer official blank mockups from v2 for each placement
    const designUrls: string[] = await fetchVariantMockups(Number(key))
    const image = designUrls[0] ?? ''
    const color = v.color || ''
    const size = v.size || ''
    await prisma.variant.upsert({
      where: { printfulVariantId: key },
      update: {
        product: { connect: { printfulProductId: String(prod.id) } },
        price: Number(v.retail_price) || 0,
        color,
        size,
        imageUrl: image,
        previewUrl: image,
        designUrls,
        deleted: false,
      },
      create: {
        printfulVariantId: key,
        product: { connect: { printfulProductId: String(prod.id) } },
        price: Number(v.retail_price) || 0,
        color,
        size,
        imageUrl: image,
        previewUrl: image,
        designUrls,
      },
    })
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('x-printful-signature') || ''
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(raw)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(raw)
  console.log('🔔 Printful webhook', body.type)

  try {
    await prisma.userEvent.create({
      data: {
        userId: null,
        sessionId: 'webhook',
        event: body.type ?? 'printful_webhook',
        entityType: 'printful',
        entityId: String(body.data?.id ?? ''),
        metadata: body,
      },
    })
  } catch (err) {
    console.error('Failed to record UserEvent', err)
  }

  const type = body.type
  if (type === 'product_updated' || type === 'product_synced' || type === 'product_created') {
    const id = body.data?.id || body.data?.product?.id || body.data?.sync_product?.id
    if (id) await upsertProduct(Number(id))
  } else if (type === 'product_deleted') {
    const id = body.data?.id || body.data?.product?.id
    if (id) {
      await prisma.product.updateMany({ where: { printfulProductId: String(id) }, data: { deleted: true } })
      await prisma.variant.updateMany({ where: { product: { printfulProductId: String(id) } }, data: { deleted: true } })
    }
  } else if (type === 'variant_deleted') {
    const id = body.data?.variant?.variant_id || body.data?.variant?.id || body.data?.id
    if (id) {
      await prisma.variant.updateMany({ where: { printfulVariantId: String(id) }, data: { deleted: true } })
    }
  }

  return NextResponse.json({ ok: true })
}
