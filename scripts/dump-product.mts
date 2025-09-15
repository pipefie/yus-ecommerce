#!/usr/bin/env ts-node
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const slug = process.argv[2]
  if (!slug) { console.error('Usage: dump-product <slug>'); process.exit(1) }
  const p = await prisma.product.findFirst({ where: { slug }, include: { variants: true } })
  if (!p) { console.error('Not found'); process.exit(1) }
  console.log('Product:', p.slug)
  const colors = Array.from(new Set(p.variants.map((v) => (v.color || '').trim()).filter(Boolean)))
  console.log('Colors:', colors.join(', '))
  for (const c of colors) {
    const vs = p.variants.filter((v) => v.color === c)
    // @ts-expect-error prisma json
    const urls = vs.flatMap((v) => Array.isArray(v.designUrls) ? v.designUrls : []) as string[]
    console.log(`- ${c} (${urls.length}):`)
    for (const u of urls.slice(0, 6)) console.log('   ', u)
  }
  await prisma.$disconnect()
}

main().catch(async (err) => { console.error(err); await prisma.$disconnect(); process.exit(1) })

