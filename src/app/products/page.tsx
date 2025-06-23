// src/app/products/page.tsx
import ShopClient from "@/components/ShopClient";
// Use cached helpers for DB access
import { getAllProducts } from "@/lib/products";
import type { Metadata } from "next";
import getT from 'next-translate/getT'

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:       "Shop Our Tees | Y-US?",
    description: "Browse our full catalog of custom tees.",
  };
}

export default async function ProductsPage({ params }: { params: { locale: string } }) {
  const t = await getT(params.locale, 'common')
  // 1) Load every product *with* its variants
  const products = await getAllProducts();

  // 2) Map into exactly the shape ShopClient expects
  const initialProducts = products.map((p) => {
    // p.variants is now guaranteed
    const v = p.variants[0]!;

    const imageUrl =
      Array.isArray(p.images) && p.images.length > 0
        ? p.images[0]
        : v.previewUrl || v.imageUrl || "/placeholder.png";

    return {
      _id:        String(p.id),
      slug:       p.slug,
      title:      p.title,
      description:p.description,
      price:      v.price,
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
