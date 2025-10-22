import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { createProductImageAction, updateProductImageAction, deleteProductImageAction } from "../actions";
import { getAssetUrl, assetPlaceholder } from "@/lib/assets";

function formatCurrency(cents: number): string {
  return `€ ${(cents / 100).toFixed(2)}`;
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
              <p className="text-xs text-slate-400">Slug: {product.slug}</p>
            </div>
            <div className="text-sm text-slate-300">Base price: {formatCurrency(product.price)}</div>
          </header>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Variants</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-xs text-slate-300">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Color</th>
                      <th className="py-2 pr-3">Size</th>
                      <th className="py-2 pr-3">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {product.variants.map((variant) => (
                      <tr key={variant.id}>
                        <td className="py-2 pr-3">{variant.id}</td>
                        <td className="py-2 pr-3 text-slate-200">{variant.color}</td>
                        <td className="py-2 pr-3 text-slate-200">{variant.size}</td>
                        <td className="py-2 pr-3">{formatCurrency(variant.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-200">Add Asset</h3>
              <form action={createProductImageAction} className="mt-3 grid gap-3 text-xs text-slate-200">
                <input type="hidden" name="productId" value={product.id} />
                <label className="flex flex-col gap-1">
                  <span className="text-slate-400">S3 Key</span>
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
                  Save Asset
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6">
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
                        <td className="py-2 pr-3 text-slate-200 break-all">{image.url}</td>
                        <td className="py-2 pr-3 text-slate-400">{variant ? `${variant.color} / ${variant.size}` : "Product"}</td>
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
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
