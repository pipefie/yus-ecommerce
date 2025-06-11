// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation"
import { Metadata } from "next"
import ProductDetailClient, { DetailProduct } from "@/components/ProductDetailClient"
import { fetchPrintifyProducts, mapToLocal } from "@/utils/printify"

type Props = { params: { id: string } }

export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const all = (await fetchPrintifyProducts()).map(mapToLocal)
  const p   = all.find((p) => p.slug === params.id)
  if (!p) return { title: "Not Found", description: "" }

  return {
    title: `${p.title} | Y-US?`,
    description: p.description.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 160),
    openGraph: { images: [p.images[0] || "/placeholder.png"] },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const all = (await fetchPrintifyProducts()).map(mapToLocal)
  const p   = all.find((p) => p.slug === params.id)
  if (!p) notFound()

  const detail: DetailProduct = {
    _id:        p.slug,
    title:      p.title,
    description:p.description,
    nsfw:       false,
    printifyId: p.printifyId,
    images:     p.images,
    price:      p.price,
    variants:   p.variants.map((v) => ({
      id:       String(v.id),
      price:    v.price,
      size:     v.size,
      color:    v.color,
      designUrl:v.designUrl,    // now available from mapToLocal
    })),
  }

  return (
    <div className="container mx-auto py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      <ProductDetailClient product={detail} />
    </div>
  )
}
