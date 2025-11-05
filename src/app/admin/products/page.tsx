import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAssetUrl, assetPlaceholder } from "@/lib/assets";
import { ProductDetailPanel } from "@/components/admin/ProductDetailPanel";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildProductHref(productId: number, query: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("product", String(productId));
  return `/admin/products?${params.toString()}`;
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const selectedParam = typeof params?.product === "string" ? params.product : "";
  const selectedId = /^\d+$/.test(selectedParam) ? Number(selectedParam) : null;

  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      variants: { orderBy: { id: "asc" } },
      productImages: { orderBy: { sortIndex: "asc" } },
    },
  });

  const normalizedQuery = query.toLowerCase();
  const filteredProducts = normalizedQuery
    ? products.filter((product) => {
        const matchesProduct =
          product.title.toLowerCase().includes(normalizedQuery) ||
          product.slug.toLowerCase().includes(normalizedQuery);
        const matchesVariant = product.variants.some((variant) =>
          `${variant.color} ${variant.size}`.toLowerCase().includes(normalizedQuery),
        );
        return matchesProduct || matchesVariant;
      })
    : products;

  const selectedProduct =
    filteredProducts.find((product) => selectedId && product.id === selectedId) ?? filteredProducts[0] ?? null;

  const emptyState = !products.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <aside className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Catalog</h2>
          <p className="text-xs text-slate-400">
            Search by product name, slug, or variant attributes. Select a row to manage details.
          </p>
        </div>
        <form method="get" className="mb-4 space-y-2">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Search
            <div className="relative">
              <input
                name="q"
                defaultValue={query}
                placeholder="e.g. hoodie, black XL"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700"
              />
              {selectedProduct && (
                <input type="hidden" name="product" value={selectedProduct.id} />
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-slate-700"
              >
                Go
              </button>
            </div>
          </label>
          {query && (
            <Link
              href="/admin/products"
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200"
            >
              Clear search
            </Link>
          )}
        </form>

        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "60vh" }}>
          {emptyState && (
            <p className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
              No products in the catalog yet. Run the Printful sync or create a product manually.
            </p>
          )}

          {!emptyState && !filteredProducts.length && (
            <p className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
              Nothing matched <span className="font-semibold text-slate-200">“{query}”</span>. Try a different term.
            </p>
          )}

          {filteredProducts.map((product) => {
            const href = buildProductHref(product.id, query);
            const isActive = selectedProduct?.id === product.id;
            const mainAsset = product.productImages.find((img) => img.selected) ?? product.productImages[0];
            const imageSrc = getAssetUrl(mainAsset?.url) ?? product.imageUrl ?? assetPlaceholder();
            const updated =
              product.updatedAt instanceof Date
                ? product.updatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                : "";
            const missingMockups = !product.productImages.length;

            return (
              <Link
                key={product.id}
                href={href}
                className={`flex gap-3 rounded-xl border px-3 py-3 transition ${
                  isActive
                    ? "border-slate-700 bg-slate-800/80 text-white shadow"
                    : "border-slate-900 bg-slate-950/40 text-slate-300 hover:border-slate-800 hover:bg-slate-900/60 hover:text-white"
                }`}
              >
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-800/80">
                  <Image src={imageSrc} alt="" fill sizes="48px" className="object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-slate-100">{product.title}</p>
                  <p className="truncate text-xs text-slate-400">{product.slug}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>{product.variants.length} variants</span>
                    <span>Updated {updated}</span>
                    {missingMockups && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-300">
                        Needs mockups
                      </span>
                    )}
                    {product.deleted && (
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-medium text-red-300">Archived</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      <section className="space-y-6">
        {!selectedProduct && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
            <p>Select a product to view configuration options.</p>
          </div>
        )}

        {selectedProduct && (
          <>
            <div className="flex justify-end">
              <Link
                href={`/admin/products/${selectedProduct.slug}`}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
              >
                Open detailed view
              </Link>
            </div>
            <ProductDetailPanel product={selectedProduct} />
          </>
        )}
      </section>
    </div>
  );
}
