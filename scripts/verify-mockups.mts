#!/usr/bin/env ts-node

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function isHttp(u: unknown): u is string {
  return typeof u === 'string' && /^https?:\/\//.test(u)
}

async function main() {
  const products = await prisma.product.findMany({ include: { variants: true } })
  const report: Array<{ slug: string; colors: string[]; imagesByColor: Record<string, string> }> = []

  for (const p of products) {
    const colors = Array.from(new Set(p.variants.map((v) => (v.color || '').trim()).filter(Boolean)))
    const imagesByColor: Record<string, string> = {}
    for (const c of colors) {
      const vs = p.variants.filter((v) => v.color === c)
      const urls: string[] = vs.flatMap((v) => (Array.isArray(v.designUrls) ? (v.designUrls as any[]) : [])).filter(isHttp)
      imagesByColor[c] = urls[0] || ''
    }
    report.push({ slug: p.slug, colors, imagesByColor })
  }

  // Print concise summary
  for (const r of report) {
    console.log(`\nProduct: ${r.slug}`)
    console.log(`Colors: ${r.colors.join(', ') || '(none)'}`)
    for (const c of r.colors) {
      console.log(`  - ${c}: ${r.imagesByColor[c]}`)
    }
  }

  // Basic automated check: at least 2 distinct first images when product has >= 2 colors
  const failures = report.filter((r) => {
    if (r.colors.length < 2) return false
    const uniq = new Set(Object.values(r.imagesByColor).filter(Boolean))
    return uniq.size < Math.min(2, r.colors.length)
  })

  if (failures.length) {
    console.warn(`\nFound ${failures.length} product(s) with identical first mockup across colors:`)
    for (const f of failures) {
      console.warn(` - ${f.slug}`)
      // dump more details per color
      const full = products.find((p) => p.slug === f.slug)!
      for (const c of f.colors) {
        const vs = full.variants.filter((v) => v.color === c)
        // @ts-expect-error prisma json
        const urls = vs.flatMap((v) => Array.isArray(v.designUrls) ? v.designUrls : []) as string[]
        console.warn(`   ${c}: [${urls.slice(0, 4).join(', ')}]`)
      }
    }
    process.exitCode = 2
  } else {
    console.log('\nAll multi-color products have distinct first mockups per color.')
  }

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
