#!/usr/bin/env node
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing variants and products image fields...')
  await prisma.variant.updateMany({
    data: {
      imageUrl:   '',
      previewUrl: '',
      designUrls: [],
    },
  })
  await prisma.product.updateMany({
    data: {
      imageUrl: '',
      images:   [],
    },
  })
  await prisma.$disconnect()
  console.log('Done.')
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})

