// src/app/products/page.tsx
import ShopClient from "@/components/ShopClient"
import dbConnect from "@/utils/dbConnect"
import ProductModel from "@/models/Product"
import type { IProduct as RawProduct, PFVariant } from "@/models/Product"

export const revalidate = 0 // rebuild on every request

export default async function ProductsPage() {
  // 1) Sync Printful → Mongo
  const base = process.env.NEXT_PUBLIC_URL!
  await fetch(`${base}/api/printful-sync`, { cache: "no-store" })

  // 2) Read your cached products
  await dbConnect()
  const raws = (await ProductModel.find()
    .sort({ updatedAt: -1 })
    .lean()) as RawProduct[]

  // 3) Map each RawProduct → flat Product for ShopClient
  const products = raws.map((p) => {
    const variant = p.variants[0]! // <— our default
    return {
      _id:       String(p._id),
      title:     p.title,
      description:p.description,
      price:     variant.price,
      imageUrl:  p.images[0]
              ?? variant.previewUrl
              ?? variant.imageUrl
              ?? "/placeholder.png",
      nsfw:      p.nsfw ?? false,
      updatedAt:  p.updatedAt.toISOString(),
    }
  })

  return (
    <div className="pt-16 min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-6">Shop Our Tees</h1>
        {/* @ts-ignore: already serialized to plain objects */}
        <ShopClient initialProducts={products} />
      </div>
    </div>
  )
}
