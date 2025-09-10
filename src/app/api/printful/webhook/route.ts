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
    const designUrls: string[] = (Array.isArray(v.files) ? v.files : [])
      // Only use preview/mockup CDN images for product page; skip raw design archive URLs
      .map((f: PrintfulFile) => f.preview_url || f.thumbnail_url)
      .filter((u): u is string => Boolean(u))
    const image = designUrls[0] ?? ''
    const color = v.color || ''
    const size = v.size || ''

    const key = String((v as any).variant_id ?? v.id)
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
