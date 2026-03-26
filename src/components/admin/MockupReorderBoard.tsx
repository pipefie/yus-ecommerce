"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { DragEvent } from "react";
import type { updateProductImageAction } from "@/app/admin/actions";

type MockupForReorder = {
  id: number;
  title: string;
  subtitle?: string | null;
  resolvedUrl: string;
  selected: boolean;
  sortIndex: number | null;
};

type MockupReorderBoardProps = {
  images: MockupForReorder[];
  updateAction: typeof updateProductImageAction;
};

function normalizeImages(images: MockupForReorder[]): MockupForReorder[] {
  return [...images]
    .sort((a, b) => {
      const left = typeof a.sortIndex === "number" ? a.sortIndex : Number.MAX_SAFE_INTEGER;
      const right = typeof b.sortIndex === "number" ? b.sortIndex : Number.MAX_SAFE_INTEGER;
      return left === right ? a.id - b.id : left - right;
    })
    .map((image) => ({ ...image }));
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function MockupReorderBoard({ images, updateAction }: MockupReorderBoardProps) {
  const [ordered, setOrdered] = useState(() => normalizeImages(images));
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const baselineRef = useRef<MockupForReorder[]>(ordered.map((image) => ({ ...image })));

  const signature = useMemo(
    () => images.map((image) => `${image.id}:${image.sortIndex ?? "null"}:${image.selected ? 1 : 0}`).join("|"),
    [images],
  );

  useEffect(() => {
    const next = normalizeImages(images);
    setOrdered(next);
    baselineRef.current = next.map((entry) => ({ ...entry }));
    setToast(null);
  }, [signature, images]);

  const hasChanges = ordered.some((image, index) => baselineRef.current[index]?.id !== image.id);

  function handleMove(currentIndex: number, nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= ordered.length) return;
    setOrdered((prev) => moveItem(prev, currentIndex, nextIndex));
  }

  function handleJump(currentIndex: number, targetIndex: number) {
    if (currentIndex === targetIndex) return;
    setOrdered((prev) => moveItem(prev, currentIndex, targetIndex));
  }

  function handleSave() {
    if (!hasChanges || isPending) return;
    setToast(null);
    startTransition(async () => {
      try {
        for (let index = 0; index < ordered.length; index += 1) {
          const image = ordered[index];
          const baseline = baselineRef.current[index];
          if (baseline?.id === image.id) {
            continue;
          }
          const formData = new FormData();
          formData.append("id", String(image.id));
          formData.append("sortIndex", String(index));
          if (image.selected) {
            formData.append("selected", "on");
          }
          await updateAction(formData);
        }
        const synced = ordered.map((image, index) => ({ ...image, sortIndex: index }));
        baselineRef.current = synced.map((entry) => ({ ...entry }));
        setOrdered(synced);
        setToast({ type: "success", message: "Mockup order updated" });
      } catch (error) {
        console.error(error);
        setToast({ type: "error", message: "Failed to update order. Please try again." });
      }
    });
  }

  function handleReset() {
    setOrdered(baselineRef.current.map((entry) => ({ ...entry })));
    setToast(null);
  }

  function handleDragStart(imageId: number, event: DragEvent<HTMLLIElement>) {
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(imageId);
  }

  function handleDragEnter(targetId: number) {
    if (draggingId === null || draggingId === targetId) return;
    setOrdered((prev) => {
      const fromIndex = prev.findIndex((entry) => entry.id === draggingId);
      const toIndex = prev.findIndex((entry) => entry.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      return moveItem(prev, fromIndex, toIndex);
    });
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  if (!images.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Carousel order</h4>
          <p className="text-xs text-slate-400">
            Drag rows or use the controls to rearrange mockups. Changes are local until you save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || isPending}
            className="rounded border border-slate-700/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            className="rounded bg-sky-500/80 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Saving…" : "Save order"}
          </button>
        </div>
      </div>
      {toast && (
        <p
          className={`mt-3 rounded border px-3 py-2 text-xs ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/40 bg-amber-500/10 text-amber-100"
          }`}
        >
          {toast.message}
        </p>
      )}
      <ol className="mt-4 space-y-3">
        {ordered.map((image, index) => (
          <li
            key={image.id}
            draggable
            onDragStart={(event) => handleDragStart(image.id, event)}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => handleDragEnter(image.id)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 transition data-[dragging=true]:opacity-60"
            data-dragging={draggingId === image.id}
          >
            <span className="w-6 text-center font-mono text-[11px] text-slate-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="relative h-12 w-12 overflow-hidden rounded border border-slate-800/80 bg-slate-950">
              <Image src={image.resolvedUrl || "/placeholder.png"} alt="" fill sizes="48px" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-semibold text-slate-100">{image.title}</span>
              {image.subtitle ? <span className="text-[11px] text-slate-400">{image.subtitle}</span> : null}
            </div>
            <div className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                onClick={() => handleMove(index, index - 1)}
                disabled={index === 0 || isPending}
                className="rounded border border-slate-700/60 px-2 py-1 text-[11px] uppercase tracking-tight text-slate-200 disabled:opacity-40"
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => handleMove(index, index + 1)}
                disabled={index === ordered.length - 1 || isPending}
                className="rounded border border-slate-700/60 px-2 py-1 text-[11px] uppercase tracking-tight text-slate-200 disabled:opacity-40"
              >
                Down
              </button>
            </div>
            <label className="ml-2 flex items-center gap-2 text-[11px] text-slate-400">
              Slot
              <select
                value={index}
                onChange={(event) => handleJump(index, Number(event.target.value))}
                disabled={isPending}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
              >
                {ordered.map((_, optionIndex) => (
                  <option key={optionIndex} value={optionIndex}>
                    {optionIndex + 1}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ol>
    </div>
  );
}

export type { MockupForReorder };
