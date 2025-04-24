// src/app/products/page.tsx
import ShopClient from "@/components/ShopClient"
import dbConnect from "@/utils/dbConnect"
import ProductModel from "@/models/Product"

export const revalidate = 86400  // rebuild once per day

export default async function ProductsPage() {
  // 1) Sync Printful → Mongo
  const base = process.env.NEXT_PUBLIC_URL!
  await fetch(`${base}/api/printful-sync`, { cache: "no-store" })

  // 2) Read your cached products
  await dbConnect()
  const products = await ProductModel.find().sort({ updatedAt: -1 }).lean()

  return (
    <div className="pt-16 min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-6">Shop Our Tees</h1>
        {/* Render the client‐side ShopClient here */}
        {/* @ts-ignore */}
        <ShopClient initialProducts={products} />
      </div>
    </div>
  )
}
