#!/usr/bin/env node
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function isHttp(u) {
  return typeof u === 'string' && /^https?:\/\//.test(u)
}

async function main() {
  const products = await prisma.product.findMany({ include: { variants: true } })
  for (const p of products) {
    const colors = Array.from(new Set(p.variants.map((v) => (v.color || '').trim()).filter(Boolean)))
    console.log(`\nProduct: ${p.slug}`)
    console.log(`Colors: ${colors.join(', ') || '(none)'}`)
    const imagesByColor = {}
    for (const c of colors) {
      const vs = p.variants.filter((v) => v.color === c)
      const urls = vs.flatMap((v) => Array.isArray(v.designUrls) ? v.designUrls : []).filter(isHttp)
      imagesByColor[c] = urls[0] || ''
      console.log(`  - ${c}: ${imagesByColor[c]}`)
    }
    if (colors.length >= 2) {
      const uniq = new Set(Object.values(imagesByColor).filter(Boolean))
      if (uniq.size < Math.min(2, colors.length)) {
        console.warn('  ! Same first mockup across colors')
      } else {
        console.log('  ✓ First mockup varies by color')
      }
    }
  }
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})

