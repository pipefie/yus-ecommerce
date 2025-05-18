// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation"
import dbConnect from "@/utils/dbConnect"
import ProductModel from "@/models/Product"
import { Metadata } from "next"
import type { IProduct as RawProduct } from "@/models/Product"
import ProductDetailClient, { DetailProduct } from "@/components/ProductDetailClient"
import { image } from "framer-motion/client"


type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await dbConnect()
  const raw = await ProductModel.findById(params.id).lean()
  if (!raw) return { title: "Not found", description: "" }

  const image = raw.images?.[0] ||
                raw.variants?.[0]?.previewUrl ||
                raw.variants?.[0]?.imageUrl ||
                "/placeholder.png"

  return {
    title: `${raw.title} | Y-US?`,
    description: raw.description.slice(0, 160),
    openGraph: { title: raw.title, images: [image] },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  await dbConnect()
  const raw = await ProductModel.findById(params.id).lean() as
    | RawProduct
    | null
  
  if (!raw) notFound()

  // **only** the fields ProductDetailClient needs:
  const detail: DetailProduct = {
    _id:        String(raw._id),
    title:      raw.title,
    description:raw.description,
    nsfw:       raw.nsfw ?? false,
    images:     raw.images,
    price:      raw.variants[0].price,
    imageUrl:   raw.images?.[0] ||
                raw.variants?.[0]?.previewUrl ||
                raw.variants?.[0]?.imageUrl ||
                "/placeholder.png",
    variants:   raw.variants.map((v) => ({
      id:         String(v.id),
      price:      v.price,
      size:       v.size,
      color:      v.color,
      imageUrl:   v.imageUrl,
      previewUrl: v.previewUrl,
    })),
  }

  return (
    <div className="pt-16 container mx-auto py-12">
      <ProductDetailClient product={detail} />
    </div>
  )
}
