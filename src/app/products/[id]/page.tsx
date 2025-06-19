// src/app/products/[id]/page.tsx
import { notFound }      from "next/navigation";
import type { Metadata }  from "next";
import ProductDetailClient from "@/components/ProductDetailClient";
// Cached helpers reduce DB round trips for repeated page loads
import { getProductBySlug, getProductSlugs } from "../../../lib/products";

type Props = { params: { id: string } };
export const revalidate = 60;

// generateStaticParams so Turbopack will pre-render each slug
export async function generateStaticParams(): Promise<Props["params"][]> {
  const slugs = await getProductSlugs();
  return slugs.map((s) => ({ id: s }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug } = await params;
  const prod = await getProductBySlug(slug);

  if (!prod) return { title: "Not found" };

  // coerce JSON → string[]
  const imgs = Array.isArray(prod.images)
    ? prod.images.filter((x): x is string => typeof x === "string")
    : [];

  const clean = prod.description.replace(/<\/?[^>]+>/g, "").slice(0, 160);

  return {
    title:       `${prod.title} | Y-US?`,
    description: clean,
    openGraph:   { images: [imgs[0] ?? "/placeholder.png"] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id: slug } = await params;

  const prod = await getProductBySlug(slug);
  if (!prod) notFound();

  // coerce JSON → string[]
  const images = Array.isArray(prod.images)
    ? prod.images.filter((x): x is string => typeof x === "string")
    : [];

  const detail = {
    id:          prod.slug,
    printifyId:  prod.printifyId,
    title:       prod.title,
    description: prod.description,
    images,               // front/back/etc product images
    price:       prod.price,
    variants:    prod.variants.map((v) => ({
      id:         String(v.id),
      color:      v.color,
      size:       v.size,
      price:      v.price,
      designUrls: Array.isArray(v.designUrls)
        ? v.designUrls.filter((x): x is string => typeof x === "string")
        : [],
    })),
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <ProductDetailClient product={detail} />
    </main>
  );
}
