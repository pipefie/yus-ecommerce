// src/components/ProductGrid.tsx
"use client"

import ProductCard, { Product as ProdType } from "./ProductCard"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<ProdType[]>)

interface ProductGridProps {
  products?: ProdType[]
}

export default function ProductGrid({ products: initialProducts }: ProductGridProps) {
  const { data: fetchedProducts, error } = useSWR<ProdType[]>('/api/products', fetcher, {
    fallbackData: initialProducts,
  })

  if (error) return <p className="text-center">Failed to load products.</p>
  if (!fetchedProducts) return <p className="text-center">Loading…</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {fetchedProducts.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}
