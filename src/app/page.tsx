// src/app/page.tsx
import HeroSection from "@/components/HeroSection"
import AnimatedShapes from "@/components/AnimatedShapes"
import ProductGrid from "@/components/ProductGrid"
import { fetchPrintifyProducts, mapToSummary } from "@/utils/printify";
import type { SummaryProduct } from "@/utils/printify"


export const revalidate = 60; // ISR: rebuild every 60s

export default async function HomePage() {
    // 1) fetch + map everything
  const raw = await fetchPrintifyProducts()
  const pfProducts: SummaryProduct[] = raw.map(mapToSummary)

  // 2) shape only the fields your grid needs
  const products = pfProducts.map((p) => ({
    _id:      p.slug,
    title:    p.title,
    description:p.description,  
    price:    p.price,
    imageUrl:  p.thumbnail || "/placeholder.png",
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
