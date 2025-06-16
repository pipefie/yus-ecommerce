// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductDetailClient, { DetailProduct, SummaryProduct } from "@/components/ProductDetailClient";
import { fetchPrintifyProducts, mapToSummary, fetchPrintifyProductDetail, mapToDetail } from "@/utils/printify";

type Props = { params: { id: string } };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // next13.4+: params can be used synchronously
  const id = params.id;
  const rawList   = await fetchPrintifyProducts();
  const summaries = rawList.map(mapToSummary);
  const summary   = summaries.find((s) => s.slug === id);
  if (!summary) {
    return { title: "Not found", description: "" };
  }
  return {
    title: `${summary.title} | Y-US?`,
    description: summary.description.replace(/<\/?[^>]+>/g, "").slice(0,160),
    openGraph: { images: [ summary.thumbnail || "/placeholder.png" ] },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const id = params.id;
  const rawList   = await fetchPrintifyProducts();
  const summaries = rawList.map(mapToSummary);
  const summary   = summaries.find((s) => s.slug === id);
  if (!summary) notFound();

  // 1) get full detail + map
  const rawDetail  = await fetchPrintifyProductDetail(summary.printifyId);
  const detailData = mapToDetail(summary.slug, rawDetail);

  // 2) build DetailProduct
  const detail: DetailProduct = {
    _id:         detailData.slug,
    title:       detailData.title,
    description: detailData.description,
    nsfw:        false,
    printifyId:  detailData.printifyId,
    images:      detailData.images,
    price:       detailData.price,
    variants:    detailData.variants.map((v) => ({
      id:    String(v.id),
      price: v.price,
      size:  v.size,
      color: v.color,
      images: v.designUrl,      // <<< our carousel images
    })),
  };

  // 3) related
  const related: SummaryProduct[] = summaries
    .filter((s) => s.slug !== id)
    .slice(0,4)
    .map((s) => ({
      id:        s.slug,
      slug:      s.slug,
      title:     s.title,
      price:     s.price,
      thumbnail: s.thumbnail,
    }));

  return (
    <main className="container mx-auto px-4 py-12">
      <ProductDetailClient product={detail} relatedProducts={related} />
    </main>
  );
}
