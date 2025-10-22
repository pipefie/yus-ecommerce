// src/app/products/page.tsx
import ShopClient from "@/components/ShopClient";
import { getAllProducts } from "@/lib/products";
import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import { getAssetUrls, assetPlaceholder } from "@/lib/assets";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shop Our Tees | Y-US?",
    description: "Browse our full catalog of custom tees.",
  };
}

export default async function ProductsPage() {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en'
  const t = await getTranslations({ locale: lang})
  const products = await getAllProducts();

  const initialProducts = products.map((p) => {
    const productImages = getAssetUrls(
      p.productImages
        .filter((img) => !img.variantId)
        .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
        .map((img) => img.url),
      { fallback: assetPlaceholder() }
    );
    const imageUrl = productImages[0] ?? assetPlaceholder();
    const variantWithPrice = p.variants.find((vv) => Number.isFinite(vv.price)) ?? p.variants[0] ?? null;
    const price = variantWithPrice?.price ?? p.price;
    return {
      _id: String(p.id),
      slug: p.slug,
      title: p.title,
      description: p.description,
      price,
      imageUrl,
      nsfw: false,
      updatedAt: p.updatedAt,
    };
  });

  return (
    <div className="pt-16 min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-6">{t('shop_our_tees')}</h1>
        {/* @ts-expect-error: already serialized */}
        <ShopClient initialProducts={initialProducts} />
      </div>
    </div>
  );
}
