"use client";

import { useEffect, useMemo, useState } from "react";
import type { Variant } from "@prisma/client";
import type { updateVariantDetailsAction } from "@/app/admin/actions";

type VariantManagerProps = {
  variants: Variant[];
  updateAction: typeof updateVariantDetailsAction;
};

function formatPriceInput(cents: number | null | undefined): string {
  const value = typeof cents === "number" ? cents : 0;
  return (value / 100).toFixed(2);
}

function getVariantLabel(variant: Variant): string {
  const color = variant.color?.trim() || "Unnamed color";
  const size = variant.size?.trim() || "OS";
  return `${color} • ${size}`;
}

export function VariantManager({ variants, updateAction }: VariantManagerProps) {
  const sortedVariants = useMemo(
    () =>
      [...variants].sort((a, b) => {
        if (a.deleted === b.deleted) return a.id - b.id;
        return a.deleted ? 1 : -1;
      }),
    [variants],
  );

  const [selectedId, setSelectedId] = useState<number | null>(sortedVariants[0]?.id ?? null);

  useEffect(() => {
    if (!selectedId || !sortedVariants.some((variant) => variant.id === selectedId)) {
      setSelectedId(sortedVariants[0]?.id ?? null);
    }
  }, [selectedId, sortedVariants]);

  if (!sortedVariants.length || selectedId === null) {
    return (
      <p className="mt-4 rounded border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400">
        No variants synced yet. Run the Printful sync to populate color/size options.
      </p>
    );
  }

  const selectedVariant = sortedVariants.find((variant) => variant.id === selectedId) ?? sortedVariants[0];
  const activeCount = sortedVariants.filter((variant) => !variant.deleted).length;

  function cycleVariant(direction: 1 | -1) {
    const index = sortedVariants.findIndex((variant) => variant.id === selectedVariant.id);
    if (index === -1) return;
    const nextIndex = (index + direction + sortedVariants.length) % sortedVariants.length;
    setSelectedId(sortedVariants[nextIndex].id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
        <span className="rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1">
          {sortedVariants.length} total variants
        </span>
        <span className="rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1">
          {activeCount} active
        </span>
        <span className="rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1">
          {sortedVariants.length - activeCount} archived
        </span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex flex-1 flex-col gap-1 text-xs text-slate-200">
          <span className="text-[11px] uppercase tracking-wide text-slate-400">Variant picker</span>
          <select
            value={selectedVariant.id}
            onChange={(event) => setSelectedId(Number(event.target.value))}
            className="rounded border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          >
            {sortedVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {getVariantLabel(variant)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => cycleVariant(-1)}
            className="flex-1 rounded border border-slate-700/70 bg-slate-900 px-3 py-2 font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => cycleVariant(1)}
            className="flex-1 rounded border border-slate-700/70 bg-slate-900 px-3 py-2 font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span className="rounded-full border border-slate-800/80 bg-slate-900 px-3 py-1 font-semibold text-slate-200">
            Variant #{selectedVariant.id}
          </span>
          {selectedVariant.printfulVariantId && (
            <span className="rounded-full border border-slate-800/80 bg-slate-900 px-3 py-1">
              Printful #{selectedVariant.printfulVariantId}
            </span>
          )}
          {selectedVariant.deleted && (
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 font-semibold text-red-200">
              Archived
            </span>
          )}
        </div>

        <form
          key={selectedVariant.id}
          action={updateAction}
          className="mt-4 grid gap-3 text-xs text-slate-200 md:grid-cols-2 xl:grid-cols-3"
        >
          <input type="hidden" name="variantId" value={selectedVariant.id} />

          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Color</span>
            <input
              name="color"
              defaultValue={selectedVariant.color ?? ""}
              className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Size</span>
            <input
              name="size"
              defaultValue={selectedVariant.size ?? ""}
              className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Price (EUR)</span>
            <input
              name="price"
              defaultValue={formatPriceInput(selectedVariant.price)}
              className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-slate-400">Primary image key or URL</span>
            <input
              name="imageUrl"
              defaultValue={selectedVariant.imageUrl ?? ""}
              className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-slate-400">Preview image key or URL</span>
            <input
              name="previewUrl"
              defaultValue={selectedVariant.previewUrl ?? ""}
              className="rounded border border-slate-800 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" name="deleted" defaultChecked={selectedVariant.deleted} />
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
      </div>
    </div>
  );
}
