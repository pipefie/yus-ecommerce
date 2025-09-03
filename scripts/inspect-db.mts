import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('DATABASE_URL =', process.env.DATABASE_URL)
  const product = await prisma.$queryRawUnsafe<any[]>("PRAGMA table_info('Product')")
  const variant = await prisma.$queryRawUnsafe<any[]>("PRAGMA table_info('Variant')")
  console.log('Product columns:')
  for (const c of product) console.log('-', c.name, c.type, c.notnull ? 'NOT NULL' : '')
  console.log('Variant columns:')
  for (const c of variant) console.log('-', c.name, c.type, c.notnull ? 'NOT NULL' : '')
}

main().finally(async () => {
  await prisma.$disconnect()
})

