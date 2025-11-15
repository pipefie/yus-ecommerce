// src/components/ProductCard.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/context/CurrencyContext";
import { trackEvent } from "@/lib/analytics/eventQueue";

export interface Product {
  slug: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { currency, rate } = useCurrency();
  const priceValue = (product.price * rate) / 100;
  const formattedPrice = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
      }).format(priceValue);
    } catch {
      return `${currency ?? "$"}${priceValue.toFixed(2)}`;
    }
  }, [currency, priceValue]);

  const capsuleLabel =
    product.title?.split(" ")?.[0]?.replace(/[^\w]/g, "").toUpperCase() || "NEW";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 text-white transition duration-300 hover:-translate-y-1 hover:border-neon/60 hover:bg-white/10"
      onClick={() => {
        trackEvent("click_product", "product", {
          entityId: product.slug,
          metadata: { source: "featured-grid" },
        });
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-30"
        style={{
          background:
            "radial-gradient(circle at top, rgba(149,255,38,0.35), transparent 65%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60">
        <Image
          src={product.imageUrl}
          alt={product.title}
          width={500}
          height={500}
          sizes="(min-width: 1280px) 320px, (min-width: 768px) 45vw, 90vw"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_10px_var(--color-neon)]" />
          {capsuleLabel}
        </span>
      </div>

      <div className="relative mt-4 flex flex-1 flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-tight line-clamp-1">{product.title}</h3>
          <p className="mt-1 text-sm text-slate-300 line-clamp-2">
            {product.description || "Limited run graphic tee."}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-semibold text-neon">{formattedPrice}</span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white transition group-hover:text-neon">
            View drop
            <span aria-hidden className="transition group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
