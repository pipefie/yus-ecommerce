// src/components/ProductDetailClient.tsx
"use client"

import { useState, useEffect } from "react"
import NSFWBlock from "@/components/NSFWBlock"
import { useCart, CartItem } from "@/context/CartContext"
import type { PFVariant } from "@/utils/printful"


export interface Variant {
  id:         string
  price:      number      // cents
  size?:      string
  color?:     string
  files?: {
    preview_url: string; // 👈 Printful's mockup URL is here
    type: string;
  }[];
}

export interface DetailProduct {
  _id:       string
  title:     string
  description:string
  nsfw:      boolean
  images:    string[]
  variants:  Variant[]
  price:    number
  imageUrl:  string
}

export default function ProductDetailClient({
  product,
}: {
  product: DetailProduct
}) {
  const { add } = useCart()

  // --- default to first variant’s size/color
  const [size, setSize]   = useState(product.variants[0]?.size ?? "")
  const [color, setColor] = useState(product.variants[0]?.color ?? "")
  const [variantId, setVariantId] = useState(product.variants[0].id)
  const variant = product.variants.find((v) => v.id === variantId)!

  // build unique lists
  const sizes  = Array.from(new Set(product.variants.map((v) => v.size))).filter(Boolean) as string[]
  const colors = Array.from(new Set(product.variants.map((v) => v.color))).filter(Boolean) as string[]

  // whenever size/color changes, pick matching variant
  useEffect(() => {
    const found = product.variants.find((v) => v.size === size && v.color === color)
    if (found) setVariantId(found.id)
  }, [size, color, product.variants])

  // Extract image URL from Printful's structure
  const imageSrc = 
   variant?.files?.[0]?.preview_url.replace('http://', 'https://')  || // 👈 Printful mockup URL
   "/placeholder.png"; // Fallback

  const price = variant?.price ?? 0

  return (
    <>
      <h1 className="font-pixel text-5xl mb-6">{product.title}</h1>

      {product.nsfw ? (
        <NSFWBlock>
          <img
            src={imageSrc}
            alt={product.title}
            width={500}
            height={500}
            className="w-full max-w-md mx-auto rounded-lg"
          />
        </NSFWBlock>
      ) : (
        <img
          src={imageSrc}
          alt={product.title}
          width={500}
          height={500}
          className="w-full max-w-md mx-auto rounded-lg"
        />
      )}

      <p className="mt-6 text-gray-700">{product.description}</p>

      <div className="mt-6 flex space-x-4">
        <div>
          <label className="block mb-1 font-medium">Size</label>
          <select value={size} onChange={e => setSize(e.target.value)}
                  className="border rounded-lg px-3 py-2">
            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Color</label>
          <select value={color} onChange={e => setColor(e.target.value)}
                  className="border rounded-lg px-3 py-2">
            {colors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <p className="mt-4 font-bold text-2xl">${(price/100).toFixed(2)}</p>
      <button onClick={() => {
                 const item: CartItem = {
                     _id:         product._id,
                     title:       product.title,
                     description: product.description,
                     price:       variant.price,
                     imageUrl:    imageSrc,
                     nsfw:        product.nsfw,
                     variantId:   variant.id,
                     quantity:    1,
                   }
                   add(item)
      }

    }
        className="mt-6 px-6 py-3 bg-neon text-black rounded font-pixel">
        Add to Cart
      </button>
    </>
  )
}
