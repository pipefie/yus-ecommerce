// src/app/page.tsx
import type { Metadata } from "next";
import HeroSection    from "@/components/HeroSection";
import AnimatedShapes from "@/components/AnimatedShapes";
import ProductGrid    from "@/components/ProductGrid";
import {prisma}         from "@/lib/prisma";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:       "Y-US? Home",
    description: "Minimal design meets unfiltered chaos.",
  };
}

export default async function HomePage() {
  // 1️⃣ pull every product + its variants from the DB
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { variants: true },
  });

  // 2️⃣ reshape to exactly what your <ProductGrid> expects
  const items = products.map((p) => {
    const v = p.variants[0]!; // default to first variant

    // pick a thumbnail: product.images[0] if you have one,
    // else the variant preview, else fallback to placeholder
    const imageUrl =
      Array.isArray(p.images) && p.images.length > 0
        ? p.images[0]
        : v.previewUrl || v.imageUrl || "/placeholder.png";

    return {
      slug:        p.slug,
      title:       p.title,
      description: p.description,
      price:       v.price,
      imageUrl,
    };
  });

  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <AnimatedShapes />

      <section
        id="products"
        className="container mx-auto py-16 z-10 relative"
      >
        <h2 className="font-pixel text-4xl text-center mb-8">
          Featured Tees
        </h2>
        {/* @ts-ignore: already serialized */}
        <ProductGrid products={items} />
      </section>
    </div>
  );
}
