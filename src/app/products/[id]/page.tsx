// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation"
import dbConnect from "@/utils/dbConnect"
import ProductModel from "@/models/Product"
import { Metadata } from "next"
import type { IProduct as RawProduct } from "@/models/Product"
import ProductDetailClient, { DetailProduct } from "@/components/ProductDetailClient"
import { fetchPrintfulProducts, mapToLocal } from "@/utils/printful";


type Props = { 
  params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const raw = await fetchPrintfulProducts();
  const products = raw.map(mapToLocal);
  const p = products.find((x) => x.slug === params.id);
  if (!p) return { title: "Not found", description: "" };

  return {
    title: `${p.title} | Y-US?`,
    description: p.description.slice(0, 160),
    openGraph: { images: [ p.images[0] || "/placeholder.png" ] },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const raw = await fetchPrintfulProducts();
  const products = raw.map(mapToLocal);
  const p = products.find((x) => x.slug === params.id);
  if (!p) notFound();


  // **only** the fields ProductDetailClient needs:
  const detail: DetailProduct = {
    _id:        p.slug,
    title:      p.title,
    description: p.description,
    nsfw:       p.nsfw ?? false,
    printfulId: p.printfulId,       // ← must match DetailProduct
    images:     p.images ?? [],     // your front/back design URLs
    price:      p.variants[0].price,
    variants:   p.variants.map((v) => ({
      id:         String(v.id),
      price:      v.price,
      size:       v.size,
      color:      v.color,
    })),
  }

  return (
    <div className="pt-16 container mx-auto py-12">
      <ProductDetailClient product={detail} />
    </div>
  )
}
