#!/usr/bin/env node
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [slug, color] = process.argv.slice(2)
  if (!slug || !color) {
    console.error('Usage: inspect-variant <slug> <color>')
    process.exit(1)
  }
  const p = await prisma.product.findFirst({ where: { slug }, include: { variants: true } })
  if (!p) { console.error('Product not found'); process.exit(1) }
  const vs = p.variants.filter((v) => v.color === color)
  console.log(`Found ${vs.length} variants for color ${color}`)
  for (const v of vs) {
    console.log('- printfulVariantId:', v.printfulVariantId)
    console.log('  imageUrl:', v.imageUrl)
    console.log('  previewUrl:', v.previewUrl)
    console.log('  designUrls length:', Array.isArray(v.designUrls) ? v.designUrls.length : 0)
    if (Array.isArray(v.designUrls)) {
      for (const u of v.designUrls.slice(0, 8)) console.log('   *', u)
    }
  }
  await prisma.$disconnect()
}

main().catch(async (err) => { console.error(err); await prisma.$disconnect(); process.exit(1) })

