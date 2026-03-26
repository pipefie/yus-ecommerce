import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductDetailPanel } from "@/components/admin/ProductDetailPanel";

type PageParams = Promise<{ id: string }>;

export default async function AdminProductDetailPage({ params }: { params: PageParams }) {
  const { id } = await params;
  const where = /^\d+$/.test(id) ? { id: Number(id) } : { slug: id };

  const product = await prisma.product.findUnique({
    where,
    include: {
      variants: { orderBy: { id: "asc" } },
      productImages: { orderBy: { sortIndex: "asc" } },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <nav className="text-xs text-slate-500">
            <Link href="/admin/products" className="hover:text-slate-200">
              Products
            </Link>
            <span className="mx-2 text-slate-700">/</span>
            <span className="text-slate-300">{product.title}</span>
          </nav>
          <h1 className="mt-2 text-xl font-semibold text-slate-100">{product.title}</h1>
          <p className="text-xs text-slate-400">
            Manage pricing, variants, and mockups. Use the quick links on the right to jump between sections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="#overview"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            Overview
          </Link>
          <Link
            href="#variants"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            Variants
          </Link>
          <Link
            href="#mockups"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            Mockups
          </Link>
          <Link
            href="#assets"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            Assets
          </Link>
        </div>
      </div>

      <ProductDetailPanel product={product} showAnchors />
    </div>
  );
}
