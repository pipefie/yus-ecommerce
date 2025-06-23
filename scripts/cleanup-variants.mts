import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1️⃣ Delete all variants with no mockups
  const emptyVariants = await prisma.variant.findMany({
    where: {
      designUrls: { equals: [] }
    },
    select: { id: true, productId: true }
  })

  const productIdsToCheck = new Set<number>()
  for (const v of emptyVariants) {
    productIdsToCheck.add(v.productId)
    await prisma.variant.delete({ where: { id: v.id } })
    console.log(`– deleted variant ${v.id} (no mockups)`)
  }

  // 2️⃣ For each affected product, if it has no more variants, delete that product too
  for (const pid of productIdsToCheck) {
    const count = await prisma.variant.count({ where: { productId: pid } })
    if (count === 0) {
      await prisma.product.delete({ where: { id: pid } })
      console.log(`– deleted product ${pid} (no remaining variants)`)
    }
  }

  // 3️⃣ Now split “Color / Size” back into two fields
  const toFix = await prisma.variant.findMany({
    where: {
      // only fix ones that still have the combined string pattern
      color: { contains: ' / ' }
    },
    select: { id: true, color: true }
  })

  for (const v of toFix) {
    const [col, siz] = v.color.split(' / ').map(s => s.trim())
    await prisma.variant.update({
      where: { id: v.id },
      data: {
        color: col,
        size:  siz
      }
    })
    console.log(`– fixed variant ${v.id}: color="${col}", size="${siz}"`)
  }

  console.log('✅ Cleanup complete')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
