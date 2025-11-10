import Image from "next/image";
import { assetPlaceholder, getAssetUrl } from "@/lib/assets";
import {
  updateProductImageAction,
  deleteProductImageAction,
} from "@/app/admin/actions";
import type { Product, ProductImage, Variant } from "@prisma/client";
import { MockupReorderBoard, type MockupForReorder } from "@/components/admin/MockupReorderBoard";

type ProductWithRelations = Product & {
  variants: Variant[];
  productImages: ProductImage[];
};

export function ProductMockupGallery({ product }: { product: ProductWithRelations }) {
  if (!product.productImages.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        No mockups imported yet. Upload an archive to populate the gallery.
      </div>
    );
  }

  const sortedImages = [...product.productImages].sort((a, b) => {
    const left = typeof a.sortIndex === "number" ? a.sortIndex : Number.MAX_SAFE_INTEGER;
    const right = typeof b.sortIndex === "number" ? b.sortIndex : Number.MAX_SAFE_INTEGER;
    return left === right ? a.id - b.id : left - right;
  });

  const variantsById = new Map(product.variants.map((variant) => [variant.id, variant]));

  const reorderPayload: MockupForReorder[] = sortedImages.map((image, index) => {
    const variant = image.variantId ? variantsById.get(image.variantId) ?? null : null;
    const resolved = getAssetUrl(image.url) ?? assetPlaceholder();
    return {
      id: image.id,
      title: image.selected ? "Hero slot" : image.kind ?? "Mockup",
      subtitle: variant ? `${variant.color ?? "Unlabeled color"} • ${variant.size ?? "OS"}` : "Product-level",
      resolvedUrl: resolved,
      selected: image.selected,
      sortIndex: typeof image.sortIndex === "number" ? image.sortIndex : index,
    };
  });

  return (
    <div className="space-y-6">
      <MockupReorderBoard images={reorderPayload} updateAction={updateProductImageAction} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sortedImages.map((image) => {
          const updateFormId = `update-image-${image.id}`;
          const variant = image.variantId ? variantsById.get(image.variantId) ?? null : null;
          const resolved = getAssetUrl(image.url) ?? assetPlaceholder();

          return (
            <article
              key={image.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 shadow-sm"
            >
            <div className="relative">
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900">
                <Image
                  src={resolved}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 240px, (min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="pointer-events-none absolute left-3 top-3 flex gap-2 text-[11px] font-semibold uppercase">
                <span
                  className={`rounded-full px-2 py-1 ${
                    image.selected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                      : "bg-slate-800/80 text-slate-300 border border-slate-700/80"
                  }`}
                >
                  {image.selected ? "Active" : "Hidden"}
                </span>
                <span className="rounded-full border border-slate-700/70 bg-slate-900/60 px-2 py-1 text-slate-300">
                  sort {image.sortIndex ?? 0}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-xs text-slate-300">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-slate-500">Storage key</span>
                <span className="break-all rounded bg-slate-900/70 px-2 py-1 font-mono text-[10px] text-slate-400">
                  {image.url}
                </span>
              </div>

              <form id={updateFormId} action={updateProductImageAction} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={image.id} />
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">Variant mapping</span>
                  <select
                    name="variantId"
                    defaultValue={image.variantId ?? ""}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  >
                    <option value="">Product-level</option>
                    {product.variants.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.color} / {entry.size}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">Role</span>
                    <input
                      name="kind"
                      defaultValue={image.kind ?? "mockup"}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">Placement</span>
                    <input
                      name="placement"
                      defaultValue={image.placement ?? ""}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                      placeholder="front, back…"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">Sort index</span>
                    <input
                      name="sortIndex"
                      type="number"
                      defaultValue={image.sortIndex ?? 0}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-slate-300">
                    <input type="checkbox" name="selected" defaultChecked={image.selected} />
                    Show on storefront
                  </label>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  form={updateFormId}
                  className="rounded bg-slate-200/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-200/20"
                >
                  Save changes
                </button>

                <form action={updateProductImageAction}>
                  <input type="hidden" name="id" value={image.id} />
                  <input type="hidden" name="sortIndex" value="0" />
                  <input type="hidden" name="kind" value={image.kind ?? "mockup"} />
                  <input type="hidden" name="selected" value="on" />
                  {variant?.id ? <input type="hidden" name="variantId" value={variant.id} /> : null}
                  {image.placement ? <input type="hidden" name="placement" value={image.placement} /> : null}
                  <button
                    type="submit"
                    className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20"
                  >
                    Set as hero
                  </button>
                </form>

                <form action={deleteProductImageAction} className="ml-auto">
                  <input type="hidden" name="id" value={image.id} />
                  <button
                    type="submit"
                    className="rounded border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </article>
        );
      })}
      </div>
    </div>
  );
}
