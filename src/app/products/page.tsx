// src/app/products/page.tsx
import ShopClient from "@/components/ShopClient";
// Use cached helpers for DB access
import { getAllProducts } from "@/lib/products";
import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:       "Shop Our Tees | Y-US?",
    description: "Browse our full catalog of custom tees.",
  };
}

export default async function ProductsPage() {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en'
  const t = await getTranslations({ locale: lang})
  // 1) Load every product *with* its variants
  const products = await getAllProducts();

  // 2) Map into exactly the shape ShopClient expects
  const initialProducts = products.map((p) => {
    const v = p.variants.find((vv) => Array.isArray(vv.designUrls) && vv.designUrls.length > 0) || p.variants[0] || null;
    const imageUrl =
      (Array.isArray(p.images) && p.images.length > 0)
        ? (p.images as unknown as string[])[0]
        : v?.previewUrl || v?.imageUrl || "/placeholder.png";
    const price = v?.price ?? p.price;
    return {
      _id:        String(p.id),
      slug:       p.slug,
      title:      p.title,
      description:p.description,
      price,
      imageUrl,
      nsfw:       false,
      updatedAt:  p.updatedAt,
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
