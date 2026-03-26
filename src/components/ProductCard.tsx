// src/components/ProductCard.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/context/CurrencyContext";
import { trackEvent } from "@/lib/analytics/eventQueue";

export interface Product {
  slug:      string;
  title:     string;
  description:string;
  price:     number;
  imageUrl:  string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { currency, rate } = useCurrency();
  const symbols: Record<string,string> = { USD: '$', EUR: '€', GBP: '£' };
  return (
    <Link
      href={`/products/${product.slug}`}   // ← ALWAYS use `slug`
      className="group block overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-200"
      onClick={() => {
        trackEvent("click_product", "product", {
          entityId: product.slug,
          metadata: { source: "featured-grid" },
        })
      }}
    >
      <div className="aspect-w-1 aspect-h-1 bg-gray-50 relative">
        <Image
          src={product.imageUrl}
          alt={product.title}
          width={500}
          height={500}
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">
          {product.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">
            {symbols[currency] || ''}{((product.price * rate) / 100).toFixed(2)}
          </span>
          <span className="text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
