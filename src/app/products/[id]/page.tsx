// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductDetailClient, { DetailProduct } from "@/components/ProductDetailClient";
import {
  fetchPrintifyProducts,
  mapToSummary,
  fetchPrintifyProductDetail,
  mapToDetail,
  SummaryProduct, // bring in the summary type from your utils
} from "@/utils/printify";

type Props = { params: { id: string } };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.id;
  const all = await fetchPrintifyProducts();
  const summaries = all.map(mapToSummary);
  const me = summaries.find((s) => s.slug === slug);
  if (!me) return { title: "Not found" };
  return {
    title: `${me.title} | Y-US?`,
    description: me.description.replace(/<\/?[^>]+>/g, "").slice(0, 160),
    openGraph: { images: [me.thumbnail || "/placeholder.png"] },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const slug = params.id;
  const all = await fetchPrintifyProducts();
  const summaries = all.map(mapToSummary);
  const me = summaries.find((s) => s.slug === slug);
  if (!me) notFound();

  const raw = await fetchPrintifyProductDetail(me.printifyId);
  const d = mapToDetail(me.slug, raw);

  const detail: DetailProduct = {
    _id: d.slug,
    title: d.title,
    description: d.description,
    printifyId: String(d.printifyId),
    images: d.images,
    price: d.price,
    variants: d.variants.map((v) => ({
      id: String(v.id),
      price: v.price,
      size: v.size,
      color: v.color,
      images: v.designUrls,
    })),
  };

  const related: SummaryProduct[] = summaries
    .filter((s) => s.slug !== slug)
    .slice(0, 4);

  return (
    <main className="container mx-auto px-4 py-12">
      <ProductDetailClient product={detail} relatedProducts={related} />
    </main>
  );
}
