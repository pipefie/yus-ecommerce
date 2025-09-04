// src/app/products/[id]/page.tsx
import { notFound }      from "next/navigation";
import type { Metadata }  from "next";
import ProductDetailClient from "@/components/ProductDetailClient";
import Script from "next/script";
// Cached helpers reduce DB round trips for repeated page loads
import { getProductBySlug, getProductSlugs } from "../../../lib/products";

type Props = { params: { id: string } };
export const revalidate = 60;

// generateStaticParams so Turbopack will pre-render each slug
export async function generateStaticParams(): Promise<Props["params"][]> {
  const slugs = await getProductSlugs();
  return slugs.map((s: string) => ({ id: s }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug } = await params;
  const prod = await getProductBySlug(slug);

  if (!prod) return { title: "Not found" };

  // coerce JSON → string[]
  const imgs = Array.isArray(prod.images)
    ? prod.images.filter((x: unknown): x is string => typeof x === "string")
    : [];

  const clean = prod.description.replace(/<\/?[^>]+>/g, "").slice(0, 160);

  return {
    title:       `${prod.title} | Y-US?`,
    description: clean,
    openGraph:   { images: [imgs[0] ?? "/placeholder.png"] },
  };
}

export default async function ProductPage({ params }: Props) {
  const DOMPurify = (await import("isomorphic-dompurify")).default;
  const { id: slug } = await params;

  const prod = await getProductBySlug(slug);
  if (!prod) notFound();

  // coerce JSON → string[]
  const images = Array.isArray(prod.images)
    ? prod.images.filter((x: unknown): x is string => typeof x === "string")
    : [];

  const baseDetail = {
    id:          prod.slug,
    printfulProductId:  prod.printfulProductId,
    title:       prod.title,
    description: DOMPurify.sanitize(prod.description),
    images,               // front/back/etc product images
    price:       prod.price,
    variants:    prod.variants.map((v: {
    id: string | number
    color: string
    size: string
    price: number
    imageUrl?: string
    previewUrl?: string
    designUrls: unknown
    }) => ({
      id:         String(v.id),
      color:      v.color,
      size:       v.size,
      price:      v.price,
      imageUrl:   (v as any).imageUrl,
      previewUrl: (v as any).previewUrl,
      designUrls: Array.isArray(v.designUrls)
        ? v.designUrls.filter((x: unknown): x is string => typeof x === "string")
        : [],
    })),
  };

  const detail = (() => {
    if (baseDetail.variants.length > 0) return baseDetail
    return {
      ...baseDetail,
      variants: [
        {
          id: 'fallback',
          color: 'Default',
          size: 'One Size',
          price: baseDetail.price,
          designUrls: baseDetail.images.length ? baseDetail.images : [],
        },
      ],
    }
  })()

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: prod.title,
    description: prod.description.replace(/<\/?[^>]+>/g, ""),
    image: images.length ? images : ["/placeholder.png"],
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (prod.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <ProductDetailClient product={detail} />
      <Script id="product-schema" type="application/ld+json">
        {JSON.stringify(productSchema)}
      </Script>
    </main>
  );
}
