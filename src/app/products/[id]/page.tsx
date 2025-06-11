// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation"
import { Metadata } from "next"
import ProductDetailClient, { DetailProduct } from "@/components/ProductDetailClient"
import { fetchPrintifyProducts, mapToLocal } from "@/utils/printify"
import type { PrintifyProduct } from "@/utils/printify"

type Props = { params: Promise<{ id: string }> }

export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const raw = await fetchPrintifyProducts()
  const products = raw.map(mapToLocal)
  const p = products.find((x) => x.slug === id)
  if (!p) return { title: "Not found", description: "" }

  const imageUrl = p.images[0] || "/placeholder.png"
  return {
    title: `${p.title} | Y-US?`,
    description: p.description.slice(0, 160),
    openGraph: { images: [imageUrl] },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const raw = await fetchPrintifyProducts()
  const products = raw.map(mapToLocal)
  const p = products.find((x) => x.slug === id)
  if (!p) notFound()

  const detail: DetailProduct = {
    _id:         p.slug,
    title:       p.title,
    description: p.description,
    nsfw:        false,
    printifyId:  p.printifyId,
    images:      p.images,      // [frontDesignUrl, backDesignUrl, ...]
    price:       p.price,
    variants:    p.variants.map((v) => ({
      id:    String(v.id),
      price: v.price,
      size:  v.size,
      color: v.color,
    })),
    
  }

  return (
    <div className="pt-16 container mx-auto py-12">
      <ProductDetailClient product={detail} />
    </div>
  )
}
