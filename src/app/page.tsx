// src/app/page.tsx
import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
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

import { prisma } from "@/lib/prisma";
import type { Product, Variant, ProductImage } from "@prisma/client";

type ProductWithImages = Product & {
  variants: Variant[];
  productImages: ProductImage[];
};

export default async function HomePage() {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en'
  const t = await getTranslations({ locale: lang })

  // Explicitly type the results to avoid inference issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, heroConfig]: [ProductWithImages[], any] = await Promise.all([
    getAllProducts() as Promise<ProductWithImages[]>,
    prisma.globalConfig.findUnique({ where: { key: "hero_video_url" } }),
  ]);
  const videoUrl = heroConfig?.value;

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
    <div className="bg-black">
      <HeroSection videoUrl={videoUrl} />

      <section
        id="products"
        className="container mx-auto py-16 z-10 relative"
      >
        <h2 className="text-4xl font-black uppercase tracking-widest text-center mb-8">
          {t('featured_tees')}
        </h2>
        <ProductGrid products={items} />
      </section>
    </div>
  );
}
