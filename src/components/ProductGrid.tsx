// src/components/ProductGrid.tsx
"use client"

import ProductCard, { Product } from "./ProductCard"


interface ProductGridProps {
  products?: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {

  if (!products) {
    return <p className="text-center">Loading products…</p>;
  }

  if (products.length === 0) {
    return <p className="text-center">No products found.</p>;
  }


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((p) => (
        <ProductCard 
          key={p.slug} 
          product={p} />
      ))}
    </div>
  )
}
