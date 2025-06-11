// src/components/ProductDetailClient.tsx
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import NSFWBlock from "@/components/NSFWBlock"
import { useCart, CartItem } from "@/context/CartContext"

export interface Variant {
  id:     string
  price:  number
  size?:  string
  color?: string
  designUrl: string
}

export interface DetailProduct {
  _id:         string
  title:       string
  description: string
  nsfw:        boolean
  printifyId:  number
  images:      string[]
  variants:    Variant[]
  price:       number
}

export default function ProductDetailClient({
  product,
}: {
  product: DetailProduct
}) {
  const { add } = useCart()

  // Variant selection
  const [size, setSize]   = useState(product.variants[0]?.size  || "")
  const [color, setColor] = useState(product.variants[0]?.color || "")
  const [variantId, setVariantId] = useState(product.variants[0].id)
  const variant = product.variants.find((v) => v.id === variantId)!

  useEffect(() => {
    const found = product.variants.find(
      (v) => v.size === size && v.color === color
    )
    if (found) setVariantId(found.id)
  }, [size, color, product.variants])

  const sizes  = Array.from(new Set(product.variants.map((v) => v.size))).filter(Boolean) as string[]
  const colors = Array.from(new Set(product.variants.map((v) => v.color))).filter(Boolean) as string[]

  // Mockup URL
  const [mockupUrl, setMockupUrl] = useState(variant.designUrl || "/placeholder.png")

  useEffect(() => {
    setMockupUrl(variant.designUrl || "/placeholder.png")
  }, [variant])


  return (
    <>
      <h1 className="font-pixel text-4xl mb-4">{product.title}</h1>

      <div className="mb-6">
        {product.nsfw ? (
          <NSFWBlock>
            <Image
              src={mockupUrl}
              alt={product.title}
              width={500}
              height={500}
              className="rounded-lg"
            />
          </NSFWBlock>
        ) : (
          <Image
            src={mockupUrl}
            alt={product.title}
            width={500}
            height={500}
            className="rounded-lg"
          />
        )}
      </div>

      <div
        className="prose prose-invert mb-6"
        dangerouslySetInnerHTML={{ __html: product.description }}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div>
          <label className="block mb-1 font-medium">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Color</label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {colors.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-2xl font-bold mb-6">
        {(variant.price / 100).toFixed(2)} €
      </p>

      <button
        onClick={() => {
          const item: CartItem = {
            _id:         product._id,
            title:       product.title,
            description: product.description,
            price:       variant.price,
            imageUrl:    mockupUrl,
            nsfw:        product.nsfw,
            variantId:   variant.id,
            quantity:    1,
          }
          add(item)
        }}
        className="px-6 py-3 bg-neon text-black font-pixel rounded"
      >
        Add to Cart
      </button>
    </>
  )
}
