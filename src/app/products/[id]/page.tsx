// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation"
import { Metadata } from "next"
import ProductDetailClient, { DetailProduct } from "@/components/ProductDetailClient"
import { fetchPrintifyProducts, mapToSummary, fetchPrintifyProductDetail, mapToDetail } from "@/utils/printify"
import { createPrintifyMockup, pollPrintifyMockup } from "@/utils/printifyMockup";

type Props = { params: { id: string } }
export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // find the slug in the summary list
  const { id } = await params;
  const rawList = await fetchPrintifyProducts();
  const summaries = rawList.map(mapToSummary);
  const summary = summaries.find((s) => s.slug === id);
  if (!summary) return { title: "Not found", description: "" };
  return {
    title: `${summary.title} | Y-US?`,
    description: summary.description.replace(/<\/?[^>]+(>|$)/g, "").slice(0,160),
    openGraph: { images: [summary.thumbnail || "/placeholder.png"] },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const rawList = await fetchPrintifyProducts();
  const summaries = rawList.map(mapToSummary);
  const summary = summaries.find((s) => s.slug === id);
  if (!summary) notFound()

  // fetch full detail
  const rawDetail = await fetchPrintifyProductDetail(summary.printifyId);
  const detailData = mapToDetail(summary.slug, rawDetail);

    // fetch mockups for each variant (front/back)
  const mockups = await Promise.all(
    (rawDetail.variants || []).map(async (v: any) => {
      try {
        const front = v.files?.[0]?.src;
        const back  = v.files?.[1]?.src;
        if (!front) return [] as string[];
        const taskId = await createPrintifyMockup(rawDetail.id, v.id, front, back);
        const urls   = await pollPrintifyMockup(taskId);
        return [urls.front, urls.back].filter(Boolean) as string[];
      } catch (err) {
        return [v.files?.[0]?.src].filter(Boolean) as string[];
      }
    })
  );

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
      images: v.designUrl,
    })),
  }

  return (
    <main className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-1 gap-10">
      <ProductDetailClient product={detail} />
    </main>
  )
}
