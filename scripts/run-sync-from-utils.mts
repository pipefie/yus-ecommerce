#!/usr/bin/env ts-node

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import {
  fetchPrintfulProducts,
  fetchPrintfulProductDetail,
  mapToSummary,
  mapToDetail,
} from '../src/utils/printful.js'
} from '../src/utils/printful.ts'

const prisma = new PrismaClient()

async function main() {
  const args = new Set(process.argv.slice(2))
  const shouldClear = args.has('--clear') || args.has('-c')

  if (shouldClear) {
    console.log('Clearing existing product and variant image fields...')
    await prisma.variant.updateMany({
      data: {
        imageUrl:   '',
        previewUrl: '',
        // @ts-expect-error prisma json
        designUrls: [] as any,
      },
    })
    await prisma.product.updateMany({
      data: {
        imageUrl: '',
        // @ts-expect-error prisma json
        images:   [] as any,
      },
    })
  }

  console.log('Fetching Printful products...')
  const rawList = await fetchPrintfulProducts()
  const summaries = rawList.map(mapToSummary)

  for (const sum of summaries) {
    const rawDetail = await fetchPrintfulProductDetail(sum.printfulProductId)
    const detail = mapToDetail(sum.slug, rawDetail)
    const basePrice = detail.variants.reduce((min, v) => Math.min(min, v.price), Infinity) || 0

    await prisma.product.upsert({
      where: { printfulProductId: String(detail.printfulProductId) },
      update: {
        slug:        detail.slug,
        title:       detail.title,
        description: detail.description,
        price:       basePrice,
        imageUrl:    detail.images[0] ?? '',
        // @ts-expect-error prisma json
        images:      detail.images,
        deleted:     false,
      },
      create: {
        printfulProductId:  String(detail.printfulProductId),
        slug:        detail.slug,
        title:       detail.title,
        description: detail.description,
        price:       basePrice,
        imageUrl:    detail.images[0] ?? '',
        // @ts-expect-error prisma json
        images:      detail.images,
      },
    })

    for (const v of detail.variants) {
      await prisma.variant.upsert({
        where: { printfulVariantId: String(v.id) },
        update: {
          product:    { connect: { printfulProductId: String(detail.printfulProductId) } },
          price:      v.price,
          color:      v.color,
          size:       v.size,
          imageUrl:   v.designUrls[0] ?? '',
          previewUrl: v.designUrls[0] ?? '',
          // @ts-expect-error prisma json
          designUrls: v.designUrls,
          deleted:    false,
        },
        create: {
          printfulVariantId: String(v.id),
          product:    { connect: { printfulProductId: String(detail.printfulProductId) } },
          price:      v.price,
          color:      v.color,
          size:       v.size,
          imageUrl:   v.designUrls[0] ?? '',
          previewUrl: v.designUrls[0] ?? '',
          // @ts-expect-error prisma json
          designUrls: v.designUrls,
        },
      })
    }
    console.log('Synced:', detail.title)
  }

  // Basic verification of mockups grouped by color
  console.log('\nVerifying mockups by color...')
  const products = await prisma.product.findMany({ include: { variants: true } })
  const results: Array<{ slug: string; ok: boolean; note?: string }> = []
  for (const p of products) {
    const colors = Array.from(new Set(p.variants.map((v) => (v.color || '').trim()).filter(Boolean)))
    if (colors.length < 2) {
      results.push({ slug: p.slug, ok: true, note: 'single-color product' })
      continue
    }
    // compare first image per color
    const firstByColor = colors.map((c) => {
      const vs = p.variants.filter((v) => v.color === c)
      // @ts-expect-error prisma json
      const urls = vs.flatMap((v) => Array.isArray(v.designUrls) ? v.designUrls : []) as string[]
      const image = urls.find((u) => typeof u === 'string' && /^https?:\/\//.test(u)) || ''
      return { color: c, image }
    })
    const uniqueImages = Array.from(new Set(firstByColor.map((x) => x.image).filter(Boolean)))
    const ok = uniqueImages.length >= Math.min(2, colors.length)
    results.push({ slug: p.slug, ok, note: ok ? 'color images vary' : 'same image across colors' })
  }
  const failed = results.filter((r) => !r.ok)
  console.table(results)
  if (failed.length) {
    console.warn(`\nVerification found ${failed.length} product(s) with identical first mockup across colors.`)
  } else {
    console.log('\nVerification passed: mockups vary by color where expected.')
  }

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
