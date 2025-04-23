"use client"

import Link from "next/link"
import { useRef, useEffect } from "react"
import VanillaTilt from "vanilla-tilt"

export interface Product {
  _id: string
  title: string
  description: string
  price: number
  imageUrl: string
  nsfw?: boolean
}

export default function ProductCard({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      VanillaTilt.init(ref.current, {
        max: 15,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
      })
    }
  }, [])

  return (
    <div
      ref={ref}
      className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-neon transition p-4"
    >
      <img
        src={product.imageUrl}
        alt={product.title}
        className="w-full h-48 object-cover rounded"
      />
      <div className="mt-3">
        <h3 className="font-pixel text-lg">{product.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {product.description}
        </p>
        <p className="mt-2 font-bold">${product.price.toFixed(2)}</p>
        <Link href={`/products/${product._id}`} className="inline-block mt-3 text-neon hover:underline">
            View Details
        </Link>
      </div>
    </div>
  )
}
