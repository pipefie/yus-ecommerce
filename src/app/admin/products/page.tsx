import Image from "next/image";
import MockupUploader from "@/components/admin/MockupUploader";
import { prisma } from "@/lib/prisma";
import {
  createProductImageAction,
  updateProductImageAction,
  deleteProductImageAction,
  updateProductDetailsAction,
  updateVariantDetailsAction,
} from "../actions";
import { getAssetUrl, assetPlaceholder } from "@/lib/assets";

function formatPriceInput(cents: number | null | undefined): string {
  const value = typeof cents === "number" ? cents : 0;
  return (value / 100).toFixed(2);
}

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      variants: { orderBy: { id: "asc" } },
      productImages: { orderBy: { sortIndex: "asc" } },
    },
  });

  return (
    <div className="space-y-10">
      {products.map((product) => (
        <section key={product.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{product.title}</h2>
              <p className="text-xs text-slate-400">
                Slug: <span className="font-mono">{product.slug}</span>
              </p>
            </div>
            <div className="text-sm text-slate-300">
              Updated: {product.updatedAt instanceof Date ? product.updatedAt.toLocaleString() : String(product.updatedAt)}
            </div>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-5">
                <h3 className="text-sm font-semibold text-slate-200">Product settings</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Adjust pricing, metadata, and the default hero asset. Leave a field blank to keep its current value.
                </p>
                <form action={updateProductDetailsAction} className="mt-4 grid gap-3 text-xs text-slate-200">
                  <input type="hidden" name="productId" value={product.id} />
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">Title</span>
                    <input
                      name="title"
                      defaultValue={product.title ?? ""}
                      className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">Short description (supports HTML)</span>
                    <textarea
                      name="description"
                      defaultValue={product.description ?? ""}
                      className="min-h-[96px] rounded border border-slate-700 bg-slate-950 px-3 py-2"
                    />
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-slate-400">Base price (EUR)</span>
                      <input
                        name="price"
                        defaultValue={formatPriceInput(product.price)}
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                        placeholder="24.99"
                        inputMode="decimal"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-slate-400">Primary image key or URL</span>
                      <input
                        name="imageKey"
                        defaultValue={product.imageUrl ?? ""}
                        className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
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
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-5">
                <h3 className="text-sm font-semibold text-slate-200">Variants &amp; inventory</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Update variant pricing, rename color/size labels, or archive a variant. Prices are interpreted in EUR.
                </p>
                <div className="mt-4 space-y-4">
                  {product.variants.map((variant) => (
                    <form
                      key={variant.id}
                      action={updateVariantDetailsAction}
                      className="grid gap-3 rounded border border-slate-800/80 bg-slate-950/60 p-4 text-xs text-slate-200 md:grid-cols-2 xl:grid-cols-4"
                    >
                      <input type="hidden" name="variantId" value={variant.id} />
                      <div className="space-y-1">
                        <span className="block text-[10px] uppercase tracking-wide text-slate-500">Variant ID</span>
                        <span className="font-mono text-slate-300">{variant.id}</span>
                      </div>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Color</span>
                        <input
                          name="color"
                          defaultValue={variant.color ?? ""}
                          className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Size</span>
                        <input
                          name="size"
                          defaultValue={variant.size ?? ""}
                          className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Price (EUR)</span>
                        <input
                          name="price"
                          defaultValue={formatPriceInput(variant.price)}
                          className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                          placeholder="19.99"
                          inputMode="decimal"
                        />
                      </label>
                      <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-slate-400">Primary image key or URL</span>
                        <input
                          name="imageUrl"
                          defaultValue={variant.imageUrl ?? ""}
                          className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                          placeholder="products/my-product/front.png"
                        />
                      </label>
                      <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-slate-400">Preview image key or URL</span>
                        <input
                          name="previewUrl"
                          defaultValue={variant.previewUrl ?? ""}
                          className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-slate-300">
                        <input type="checkbox" name="deleted" defaultChecked={variant.deleted} />
                        Archive variant
                      </label>
                      <div className="flex items-end justify-end md:col-span-2 xl:col-span-1">
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded bg-slate-200/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-200/20"
                        >
                          Save variant
                        </button>
                      </div>
                    </form>
                  ))}
                  {!product.variants.length && (
                    <p className="text-xs text-slate-400">No variants synced for this product yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-5">
                <h3 className="text-sm font-semibold text-slate-200">Assets</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-slate-300">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Preview</th>
                        <th className="py-2 pr-3">Key</th>
                        <th className="py-2 pr-3">Variant</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Sort</th>
                        <th className="py-2 pr-3">Selected</th>
                        <th className="py-2 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {product.productImages.map((image) => {
                        const resolved = getAssetUrl(image.url) ?? assetPlaceholder();
                        const variant = image.variantId ? product.variants.find((v) => v.id === image.variantId) : null;
                        const formId = `update-${image.id}`;
                        return (
                          <tr key={image.id}>
                            <td className="py-2 pr-3">
                              <div className="relative h-12 w-12 overflow-hidden rounded">
                                <Image src={resolved} alt="" fill sizes="48px" className="object-cover" />
                              </div>
                            </td>
                            <td className="break-all py-2 pr-3 text-slate-200">{image.url}</td>
                            <td className="py-2 pr-3 text-slate-400">
                              {variant ? `${variant.color} / ${variant.size}` : "Product"}
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                form={formId}
                                name="kind"
                                defaultValue={image.kind}
                                className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1"
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                form={formId}
                                name="sortIndex"
                                type="number"
                                defaultValue={image.sortIndex}
                                className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1"
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <label className="flex items-center gap-1 text-slate-400">
                                <input form={formId} type="checkbox" name="selected" defaultChecked={image.selected} /> Active
                              </label>
                            </td>
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-2">
                                <form id={formId} action={updateProductImageAction} className="flex items-center gap-2">
                                  <input type="hidden" name="id" value={image.id} />
                                  <button
                                    type="submit"
                                    className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                                  >
                                    Update
                                  </button>
                                </form>
                                <form action={deleteProductImageAction}>
                                  <input type="hidden" name="id" value={image.id} />
                                  <button
                                    type="submit"
                                    className="rounded bg-red-500/70 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500"
                                  >
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!product.productImages.length && (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-xs text-slate-500">
                            No assets linked yet. Upload a mockup archive or add keys manually.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-5">
                <h3 className="text-sm font-semibold text-slate-200">Mockup archive upload</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Upload a ZIP exported from Printful or your design team. The importer preserves folder structure and
                  reads <code className="rounded bg-slate-800 px-1">mockups.json</code> manifests when present.
                </p>
                <MockupUploader productId={product.id} productSlug={product.slug} />
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-5">
                <h3 className="text-sm font-semibold text-slate-200">Manual asset entry</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Paste an existing S3 key if you uploaded files outside the importer. Keys are resolved against your
                  CloudFront distribution automatically.
                </p>
                <form action={createProductImageAction} className="mt-3 grid gap-3 text-xs text-slate-200">
                  <input type="hidden" name="productId" value={product.id} />
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">S3 key</span>
                    <input
                      name="key"
                      required
                      placeholder="products/slug/image.png"
                      className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">Variant ID (optional)</span>
                    <input
                      name="variantId"
                      placeholder="e.g. 12"
                      className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                    />
                  </label>
                  <div className="flex gap-3">
                    <label className="flex-1 text-slate-400">
                      <span className="block text-slate-400">Role</span>
                      <input
                        name="kind"
                        defaultValue="mockup"
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                      />
                    </label>
                    <label className="w-24 text-slate-400">
                      <span className="block text-slate-400">Sort</span>
                      <input
                        name="sortIndex"
                        type="number"
                        defaultValue={product.productImages.length}
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded bg-sky-500/80 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
                  >
                    Save asset
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
