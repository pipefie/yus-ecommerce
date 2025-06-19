import { prisma } from './prisma'
import { unstable_cache } from 'next/cache'

/**
 * Memoized DB queries for product data.
 * `unstable_cache` caches results on the server and revalidates
 * them every 60 seconds so pages remain mostly static while
 * avoiding repeated database hits.
 */
export const getAllProducts = unstable_cache(
  async () =>
    prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { variants: true },
    }),
  ['all-products'],
  { revalidate: 60 }
)

export const getProductBySlug = (slug: string) =>
  unstable_cache(
    () =>
      prisma.product.findUnique({
        where: { slug },
        include: { variants: true },
      }),
    ['product', slug],
    { revalidate: 60 }
  )()

export const getProductSlugs = unstable_cache(
  async () => {
    const all = await prisma.product.findMany({ select: { slug: true } })
    return all.map((p) => p.slug)
  },
  ['product-slugs'],
  { revalidate: 60 }
)