// src/app/page.tsx
import HeroSection from "@/components/HeroSection"
import AnimatedShapes from "@/components/AnimatedShapes"
import ProductGrid from "@/components/ProductGrid"

export default function HomePage() {
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
        <ProductGrid />
      </section>
    </div>
  )
}
