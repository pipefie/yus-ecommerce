// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation"
import dbConnect from "@/utils/dbConnect"
import ProductModel from "@/models/Product"
import type { IProduct as RawProduct } from "@/models/Product"
import { Metadata } from "next"
import ProductDetailClient from "@/components/ProductDetailClient"  // the client piece
import type { Product as UIProduct } from "@/components/ProductCard"

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await dbConnect()
  const raw = (await ProductModel.findById(params.id).lean()) as RawProduct | null
  if (!raw) {
    return { title: "Product Not Found – Y-US?", description: "" }
  }
  const desc = raw.description ?? ""
  const image = raw.imageUrl ?? "/default-og.png"

  return {
    title: `${raw.title} | Y-US?`,
    description: desc.slice(0, 160),
    openGraph: {
      title: raw.title,
      description: desc.slice(0, 160),
      images: [image],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  await dbConnect()
  const raw = (await ProductModel.findById(params.id).lean()) as RawProduct | null
  if (!raw) notFound()

  // Map to UIProduct, converting _id → string
  const product: UIProduct = {
    _id:       String(raw._id),
    title:     raw.title,
    description: raw.description ?? "",
    price:     raw.price,
    imageUrl:  raw.imageUrl ?? "",
    nsfw:      raw.nsfw ?? false,
  }

  return (
    <div className="pt-16 container mx-auto py-12">
      {/* Pass into the client component */}
      <ProductDetailClient product={product} />
    </div>
  )
}
