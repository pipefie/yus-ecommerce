// src/app/products/page.tsx
import ProductGrid from "@/components/ProductGrid"
import dbConnect from "@/utils/dbConnect"
import Product from "@/models/Product"

export const revalidate = 86400  // Regenerate page (and run sync) once per day

export default async function ProductsPage() {
  // 1) Sync from Printful into MongoDB on each ISR rebuild
  await fetch("/api/printful-sync", { cache: "no-store" })

  // 2) Query your local DB directly for SSR
  await dbConnect()
  const products = await Product.find().sort({ updatedAt: -1 }).lean()

  return (
    <section className="container mx-auto py-12">
      <h1 className="font-pixel text-4xl mb-6">Shop Our Tees</h1>
      {/* Pass in the SSR-fetched products to avoid double-fetch on mount */}
      {/* @ts-ignore server->client prop */}
      <ProductGrid products={products} />
    </section>
  )
}
