import MockupUploader from "@/components/admin/MockupUploader";
import {
  createProductImageAction,
  updateProductDetailsAction,
  updateVariantDetailsAction,
} from "@/app/admin/actions";
import type { Product, ProductImage, Variant } from "@prisma/client";
import { ProductMockupGallery } from "@/components/admin/ProductMockupGallery";
import { VariantManager } from "@/components/admin/VariantManager";

type ProductWithRelations = Product & {
  variants: Variant[];
  productImages: ProductImage[];
};

function formatPriceInput(cents: number | null | undefined): string {
  const value = typeof cents === "number" ? cents : 0;
  return (value / 100).toFixed(2);
}

export function ProductDetailPanel({
  product,
  showAnchors = false,
}: {
  product: ProductWithRelations;
  showAnchors?: boolean;
}) {
  const totalMockups = product.productImages.length;
  const productLevelMockups = product.productImages.filter((image) => !image.variantId).length;
  const variantCoverage = product.variants.filter((variant) =>
    product.productImages.some((image) => image.variantId === variant.id),
  ).length;

  return (
    <>
      <section
        id={showAnchors ? "overview" : undefined}
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
      >
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{product.title}</h2>
            <p className="text-xs text-slate-400">
              ID #{product.id} • Slug {product.slug} • {product.variants.length} variants
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span>
              Base price:{" "}
              <span className="font-semibold text-slate-100">{formatPriceInput(product.price)} EUR</span>
            </span>
            {product.deleted && (
              <span className="rounded bg-red-500/10 px-2 py-1 font-semibold text-red-300">Archived</span>
            )}
          </div>
        </header>

        <form action={updateProductDetailsAction} className="mt-6 grid gap-4 text-xs text-slate-200">
          <input type="hidden" name="productId" value={product.id} />
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Title</span>
            <input
              name="title"
              defaultValue={product.title ?? ""}
              className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Short description (supports HTML)</span>
            <textarea
              name="description"
              defaultValue={product.description ?? ""}
              className="min-h-[120px] rounded border border-slate-800 bg-slate-950 px-3 py-2"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-slate-400">Base price (EUR)</span>
              <input
                name="price"
                defaultValue={formatPriceInput(product.price)}
                className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
                inputMode="decimal"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-400">Primary image key or URL</span>
              <input
                name="imageKey"
                defaultValue={product.imageUrl ?? ""}
                className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
                placeholder="products/my-product/hero.png"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" name="deleted" defaultChecked={product.deleted} />
            Archive product (hide from storefront)
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-sky-500/80 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
            >
              Save product changes
            </button>
          </div>
        </form>
      </section>

      <section
        id={showAnchors ? "variants" : undefined}
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
      >
        <h3 className="text-sm font-semibold text-slate-200">Variants &amp; inventory</h3>
        <p className="text-xs text-slate-400">
          Pick any variant from the selector to update pricing, rename color/size labels, or archive it without scrolling
          through the entire list.
        </p>
        <div className="mt-4">
          <VariantManager variants={product.variants} updateAction={updateVariantDetailsAction} />
        </div>
      </section>

      <section id={showAnchors ? "mockups" : undefined} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <MockupUploader
              productSlug={product.slug}
              heading="Append mockups"
              description="Drag-and-drop a ZIP exported from Printful or your design team. Use dry run to validate before writing to S3."
            />
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <MockupUploader
              productSlug={product.slug}
              defaultMode="replace"
              defaultDryRun={false}
              heading="Replace existing mockups"
              description="Use this when you want to wipe current selections and publish a fresh set. Files are written immediately—no dry run."
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-200">Mockup gallery</h3>
          <p className="text-xs text-slate-400">
            Reorder, toggle visibility, or reassign mockups to variants. Use “Set as hero” to pin an image to the top of
            the storefront carousel.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
            <span className="rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1">
              {totalMockups} total mockups
            </span>
            <span className="rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1">
              {productLevelMockups} product-level
            </span>
            <span className="rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1">
              {variantCoverage}/{product.variants.length} variants covered
            </span>
          </div>
          <div className="mt-4">
            <ProductMockupGallery product={product} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-200">Manual asset entry</h3>
          <p className="text-xs text-slate-400">
            Paste a pre-uploaded S3 key. Ideal if assets were transferred manually or generated outside the importer.
          </p>
          <form action={createProductImageAction} className="mt-3 grid gap-3 text-xs text-slate-200">
            <input type="hidden" name="productId" value={product.id} />
            <label className="flex flex-col gap-1">
              <span className="text-slate-400">S3 key</span>
              <input
                name="key"
                required
                placeholder="products/slug/image.png"
                className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-400">Variant ID (optional)</span>
              <input
                name="variantId"
                placeholder="e.g. 12"
                className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
              />
            </label>
            <div className="flex gap-3">
              <label className="flex-1 text-slate-400">
                <span className="block text-slate-400">Role</span>
                <input
                  name="kind"
                  defaultValue="mockup"
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2"
                />
              </label>
              <label className="w-24 text-slate-400">
                <span className="block text-slate-400">Sort</span>
                <input
                  name="sortIndex"
                  type="number"
                  defaultValue={product.productImages.length}
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-slate-400">
              <span className="block text-slate-400">Placement (optional)</span>
              <input
                name="placement"
                placeholder="front, back…"
                className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" name="selected" defaultChecked />
              Mark as active
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-sky-500/80 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
            >
              Save asset
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
