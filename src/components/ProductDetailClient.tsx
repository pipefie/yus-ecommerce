// src/components/ProductDetailClient.tsx
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import NSFWBlock from "@/components/NSFWBlock"
import { useCart, CartItem } from "@/context/CartContext"

export interface Variant {
  id:     string
  price:  number      // cents
  size?:  string
  color?: string
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

export default async function ProductDetailClient({
  product,
}: {
  product: DetailProduct
}) {
  const { add } = useCart()

  // --- variant selection
  const [size, setSize]     = useState(product.variants[0]?.size    || "")
  const [color, setColor]   = useState(product.variants[0]?.color   || "")
  const [variantId, setVariantId] = useState(product.variants[0].id)
  const variant = product.variants.find((v) => v.id === variantId)!

  // update variant when size/color change
  useEffect(() => {
    const found = product.variants.find((v) => v.size === size && v.color === color)
    if (found) setVariantId(found.id)
  }, [size, color, product.variants])

  const sizes  = Array.from(new Set(product.variants.map((v) => v.size))).filter(Boolean) as string[]
  const colors = Array.from(new Set(product.variants.map((v) => v.color))).filter(Boolean) as string[]

  // --- mockup generation
  const [mockupUrl, setMockupUrl] = useState("/placeholder.png")

  useEffect(() => {
    fetch("/api/mockups", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId:  Number(variantId),
        frontImgUrl: product.images[0],
        backImgUrl:  product.images[1] ?? product.images[0],
      }),
    })
      .then((res) => res.ok ? res.json() : Promise.resolve({ preview_url: undefined }))
      .then((data) => {
        if (data.preview_url) setMockupUrl(data.preview_url)
      })
      .catch(console.error)
  }, [variantId, product.images])

  // --- render
  return (
    <>
      <h1 className="font-pixel text-5xl mb-6">{product.title}</h1>

      {product.nsfw ? (
        <NSFWBlock>
          <div className="w-full max-w-md mx-auto relative aspect-square">
            <Image
              src={mockupUrl}
              alt={product.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        </NSFWBlock>
      ) : (
        <div className="w-full max-w-md mx-auto relative aspect-square">
          <Image
            src={mockupUrl}
            alt={product.title}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      )}

      <p className="mt-6 text-gray-700">{product.description}</p>

      <div className="mt-6 flex space-x-4">
        <div>
          <label className="block mb-1 font-medium">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Color</label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-4 font-bold text-2xl">
        ${(variant.price / 100).toFixed(2)}
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
        className="mt-6 px-6 py-3 bg-neon text-black rounded font-pixel"
      >
        Add to Cart
      </button>
    </>
  )
}

