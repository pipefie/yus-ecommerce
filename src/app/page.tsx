// src/app/page.tsx
import HeroSection from "@/components/HeroSection"
import AnimatedShapes from "@/components/AnimatedShapes"
import ProductGrid from "@/components/ProductGrid"
import { fetchPrintifyProducts, mapToLocal } from "@/utils/printify";
import type { PrintifyProduct } from "@/utils/printify"

export const revalidate = 60; // ISR: rebuild every 60s

export default async function HomePage() {
    // 1) fetch + map everything
  const raw = await fetchPrintifyProducts()
  const pfProducts: PrintifyProduct[] = raw.map(mapToLocal)

  // 2) shape only the fields your grid needs
  const products = pfProducts.map((p) => ({
    _id:      p.slug,
    title:    p.title,
    description:p.description,  
    price:    p.price,
    imageUrl: p.images[0] || "/placeholder.png",
  }))
  return (
    <div className="relative overflow-hidden">
      {/* 1. Full-screen hero with video, glitch text, and animated shapes */}
      <HeroSection />

      {/* 2. Floating background shapes layer (glass-abstract style) */}
      <AnimatedShapes />

      {/* 3. Featured products section */}
      <section
        id="products"
        className="container mx-auto py-16 z-10 relative"
      >
        <h2 className="font-pixel text-4xl text-center mb-8">
          Featured Tees
        </h2>
        <ProductGrid products={products}/>
      </section>
    </div>
  )
}
