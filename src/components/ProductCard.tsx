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
    <Link
      href={`/products/${product._id}`}
      className="group block overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-200"
    >
      <div className="aspect-w-1 aspect-h-1 bg-gray-50">
        <img
          src={product.imageUrl || "/placeholder.png"}
          alt={product.title}
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-200"
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">
            ${(product.price / 100).toFixed(2)}
          </span>
          <span className="text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            View →
          </span>
        </div>
      </div>
    </Link>
  )
}
