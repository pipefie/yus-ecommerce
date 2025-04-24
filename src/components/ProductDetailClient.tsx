// src/components/ProductDetailClient.tsx
"use client"

import { Product } from "@/components/ProductCard"
import NSFWBlock from "@/components/NSFWBlock"
import { useCart } from "@/context/CartContext"

export default function ProductDetailClient({ product }: { product: Product }) {
  const { add } = useCart()

  return (
    <>
      <h1 className="font-pixel text-5xl mb-6">{product.title}</h1>

      {product.nsfw ? (
        <NSFWBlock>
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full max-w-md mx-auto rounded-lg"
          />
        </NSFWBlock>
      ) : (
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full max-w-md mx-auto rounded-lg"
        />
      )}

      <p className="mt-6 text-gray-700">{product.description}</p>
      <p className="mt-4 font-bold text-2xl">
        ${(product.price / 100).toFixed(2)}
      </p>

      <button
        onClick={() => add(product)}
        className="mt-6 px-6 py-3 bg-neon text-black rounded font-pixel"
      >
        Add to Cart
      </button>
    </>
  )
}
