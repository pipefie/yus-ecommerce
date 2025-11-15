// src/components/ProductGrid.tsx
"use client"

import { useEffect } from "react"
import ProductCard, { Product } from "./ProductCard"
import { trackEvent } from "@/lib/analytics/eventQueue"

interface ProductGridProps {
  products?: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  useEffect(() => {
    if (!products) return
    products.forEach((product, index) => {
      trackEvent("view_product_list_item", "product", {
        entityId: product.slug,
        metadata: { position: index, source: "featured-grid" },
        dedupeKey: `view-list-${product.slug}`,
      })
    })
  }, [products])

  if (!products) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-slate-300">
        Loading products…
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-slate-300">
        No products found. Check back after the next drop.
      </div>
    )
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  )
}
