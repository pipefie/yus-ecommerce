// src/app/page.tsx
import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import AnimatedShapes from "@/components/AnimatedShapes";
import ProductGrid from "@/components/ProductGrid";
import { getTranslations } from 'next-intl/server'
import { getAllProducts } from "../lib/products";
import { cookies } from 'next/headers';
import { getAssetUrls, assetPlaceholder } from "@/lib/assets";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Y-US? Home",
    description: "Minimal design meets unfiltered chaos.",
  };
}

export default async function HomePage() {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en'
  const t = await getTranslations({ locale: lang})
  const products = await getAllProducts();

  const items = products.map((p) => {
    const productImages = getAssetUrls(
      p.productImages
        .filter((img) => !img.variantId)
        .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
        .map((img) => img.url),
      { fallback: assetPlaceholder() }
    );

    const variantWithPrice = p.variants.find((vv) => Number.isFinite(vv.price)) ?? p.variants[0] ?? null;
    const imageUrl = productImages[0] ?? assetPlaceholder();

    return {
      slug: p.slug,
      title: p.title,
      description: p.description,
      price: variantWithPrice?.price ?? p.price,
      imageUrl,
    };
  });

  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <AnimatedShapes />

      <section
        id="products"
        className="relative z-10 mx-auto max-w-6xl px-4 py-16"
      >
        <div className="text-center">
          <p className="section-kicker text-neon">{t('featured_tees')}</p>
          <h2 className="mt-3 text-3xl font-semibold">Hand-picked chaos for this week.</h2>
          <p className="mt-3 text-sm text-slate-300">
            Limited units per design. When it&apos;s gone, it&apos;s gone. Tap in.
          </p>
        </div>
        <div className="mt-10">
          {/* @ts-expect-error: already serialized */}
          <ProductGrid products={items} />
        </div>
      </section>
    </div>
  );
}
