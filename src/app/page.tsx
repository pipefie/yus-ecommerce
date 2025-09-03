// src/app/page.tsx
import type { Metadata } from "next";
import HeroSection    from "@/components/HeroSection";
import AnimatedShapes from "@/components/AnimatedShapes";
import ProductGrid    from "@/components/ProductGrid";
import { getTranslations } from 'next-intl/server'
// Cached DB helpers avoid repeat queries across components
import { getAllProducts } from "../lib/products";
import { cookies } from 'next/headers';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:       "Y-US? Home",
    description: "Minimal design meets unfiltered chaos.",
  };
}

export default async function HomePage() {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en'
  const t = await getTranslations({ locale: lang})
  // 1️⃣ pull every product + its variants from the DB
  // cached in src/lib/products.ts to minimize database load
  const products = await getAllProducts();

  // 2️⃣ reshape to exactly what your <ProductGrid> expects
  const items = products.map((p) => {
    const v = p.variants.find((vv) => Array.isArray(vv.designUrls) && vv.designUrls.length > 0) || p.variants[0] || null;

    const imageUrl =
      (Array.isArray(p.images) && p.images.length > 0)
        ? (p.images as unknown as string[])[0]
        : v?.previewUrl || v?.imageUrl || "/placeholder.png";

    return {
      slug:        p.slug,
      title:       p.title,
      description: p.description,
      price:       v?.price ?? p.price,
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
          {t('featured_tees')}
        </h2>
        {/* @ts-expect-error: already serialized */}
        <ProductGrid products={items} />
      </section>
    </div>
  );
}
