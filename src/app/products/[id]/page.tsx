// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "@/components/ProductDetailClient";
import { getAssetUrl, assetPlaceholder } from "@/lib/assets";
import { getProductBySlug, getProductSlugs } from "../../../lib/products";

type PageParams = Promise<{ id: string }>;
export const revalidate = 60;

type ProductRecord = Awaited<ReturnType<typeof getProductBySlug>>;

function collectMockupAssets(prod: ProductRecord | null) {
  if (!prod) {
    return {
      productImages: [assetPlaceholder()],
      variantMap: new Map<number, string[]>(),
    };
  }

  const selected = Array.isArray(prod.productImages) ? [...prod.productImages] : [];
  selected.sort((a, b) => (a?.sortIndex ?? 0) - (b?.sortIndex ?? 0));

  const productImages: string[] = [];
  const seenProduct = new Set<string>();
  const variantMap = new Map<number, string[]>();

  for (const img of selected) {
    const resolved = getAssetUrl(img?.url);
    if (!resolved) continue;

    if (img?.variantId) {
      const id = Number(img.variantId);
      if (!Number.isFinite(id)) continue;
      const existing = variantMap.get(id) ?? [];
      if (!existing.includes(resolved)) {
        existing.push(resolved);
        variantMap.set(id, existing);
      }
      continue;
    }

    if (!seenProduct.has(resolved)) {
      seenProduct.add(resolved);
      productImages.push(resolved);
    }
  }

  if (!productImages.length) {
    productImages.push(assetPlaceholder());
  }

  return {
    productImages,
    variantMap,
  };
}

export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  const slugs = await getProductSlugs();
  return slugs.map((slug: string) => ({ id: slug }));
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { id: slug } = await params;
  const prod = await getProductBySlug(slug);

  if (!prod) return { title: "Not found" };

  const assets = collectMockupAssets(prod);
  const imgs = assets.productImages;

  const clean = prod.description.replace(/<\/?[^>]+>/g, "").slice(0, 160);

  return {
    title: `${prod.title} | Y-US?`,
    description: clean,
    openGraph: { images: [imgs[0] ?? assetPlaceholder()] },
  };
}

export default async function ProductPage({ params }: { params: PageParams }) {
  const DOMPurify = (await import("isomorphic-dompurify")).default;
  const { id: slug } = await params;

  const prod = await getProductBySlug(slug);
  if (!prod) notFound();

  const assets = collectMockupAssets(prod);
  const productImages = assets.productImages;
  const variantMockups = assets.variantMap;

  const baseDetail = {
    id: prod.slug,
    printfulProductId: prod.printfulProductId,
    title: prod.title,
    description: DOMPurify.sanitize(prod.description),
    images: productImages,
    price: prod.price,
    variants: prod.variants.map((v) => {
      const variantId = Number(v.id);
      const mockups = variantMockups.get(variantId) ?? [];
      const designUrls = mockups.length ? mockups : productImages;
      const imageUrl = getAssetUrl(v.imageUrl) ?? designUrls[0] ?? productImages[0] ?? assetPlaceholder();
      const previewUrl = getAssetUrl(v.previewUrl) ?? designUrls[0] ?? productImages[0] ?? assetPlaceholder();

      return {
        id: String(v.id),
        color: v.color,
        size: v.size,
        price: v.price,
        imageUrl,
        previewUrl,
        designUrls,
      };
    }),
  };

  const detail = baseDetail.variants.length
    ? baseDetail
    : {
        ...baseDetail,
        variants: [
          {
            id: "fallback",
            color: "Default",
            size: "One Size",
            price: baseDetail.price,
            designUrls: baseDetail.images.length ? baseDetail.images : [assetPlaceholder()],
          },
        ],
      };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: prod.title,
    description: prod.description.replace(/<\/?[^>]+>/g, ""),
    image: productImages.length ? productImages : [assetPlaceholder()],
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
      <script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </main>
  );
}