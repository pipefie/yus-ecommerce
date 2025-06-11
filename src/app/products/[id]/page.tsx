// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductDetailClient, { DetailProduct } from "@/components/ProductDetailClient";
import {
  fetchPrintifyProducts,
  mapToSummary,
  fetchPrintifyProductDetail,
  mapToDetail,
} from "@/utils/printify";

type Props = { params: Promise<{ id: string }>};
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // find the slug in the summary list
  const { id } = await params;
  const rawList = await fetchPrintifyProducts();
  const summaries = rawList.map(mapToSummary);
  const summary = summaries.find((s) => s.slug === id);
  if (!summary) return { title: "Not found", description: "" };
  return {
    title: `${summary.title} | Y-US?`,
    description: summary.description.slice(0, 160),
    openGraph: { images: [summary.thumbnail || "/placeholder.png"] },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  // fetch summary to get printifyId
  const { id } = await params;
  const rawList = await fetchPrintifyProducts();
  const summaries = rawList.map(mapToSummary);
  const summary = summaries.find((s) => s.slug === id);
  if (!summary) notFound();

  // fetch full detail
  const rawDetail = await fetchPrintifyProductDetail(summary.printifyId);
  const detailData = mapToDetail(summary.slug, rawDetail);

  // shape into DetailProduct for the client
  const detail: DetailProduct = {
    _id:         detailData.slug,
    title:       detailData.title,
    description: detailData.description,
    nsfw:        false,
    printifyId:  detailData.printifyId,
    images:      detailData.images,
    price:       detailData.price,
    variants:    detailData.variants.map((v) => ({
      id:        String(v.id),
      price:     v.price,
      size:      v.size,
      color:     v.color,
      designUrl: v.designUrl,
    })),
  };

  return (
    <div className="container mx-auto py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      <ProductDetailClient product={detail} />
    </div>
  );
}
