// src/components/ProductCard.tsx
"use client";
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
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-black/60 transition hover:-translate-y-1 hover:border-emerald-400/60"
      onClick={() => {
        trackEvent("click_product", "product", {
          entityId: product.slug,
          metadata: { source: "featured-grid" },
        })
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-900">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold text-white line-clamp-2 leading-tight mb-1">
          {product.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            {symbols[currency] || ''}{((product.price * rate) / 100).toFixed(2)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 opacity-0 transition-opacity group-hover:opacity-100">
            View drop →
          </span>
        </div>
      </div>
    </Link>
  );
}
