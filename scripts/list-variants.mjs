#!/usr/bin/env node
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const slug = process.argv[2]
  if (!slug) { console.error('Usage: list-variants <slug>'); process.exit(1) }
  const p = await prisma.product.findFirst({ where: { slug }, include: { variants: { orderBy: { id: 'asc' } } } })
  if (!p) { console.error('Product not found'); process.exit(1) }
  console.log('Product:', p.slug)
  for (const v of p.variants) {
    console.log(`${v.id}	pf:${v.printfulVariantId}	color:${v.color}	size:${v.size}`)
  }
  await prisma.$disconnect()
}

main().catch(async (err) => { console.error(err); await prisma.$disconnect(); process.exit(1) })

