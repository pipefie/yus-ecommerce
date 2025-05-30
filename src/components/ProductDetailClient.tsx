// src/components/ProductDetailClient.tsx
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import NSFWBlock from "@/components/NSFWBlock"
import { useCart, CartItem } from "@/context/CartContext"

export interface Variant {
  id:      string
  price:   number      // cents
  size?:   string
  color?:  string
}

export interface DetailProduct {
  _id:       string
  title:     string
  description:string
  nsfw:      boolean
  printfulId:number     // you’ll need this for the mockup API
  images:    string[]   // your raw design URLs, e.g. [frontDesign, backDesign]
  variants:  Variant[]
  price:     number
}

export default function ProductDetailClient({
  product,
}: {
  product: DetailProduct
}) {
  const { add } = useCart()

  // --- default to first variant’s size/color
  const [size, setSize]     = useState(product.variants[0]?.size  || "")
  const [color, setColor]   = useState(product.variants[0]?.color || "")
  const [variantId, setVariantId] = useState(product.variants[0].id)
  const variant = product.variants.find((v) => v.id === variantId)!

  // build unique lists
  const sizes  = Array.from(new Set(product.variants.map((v) => v.size))).filter(Boolean) as string[]
  const colors = Array.from(new Set(product.variants.map((v) => v.color))).filter(Boolean) as string[]

  // whenever size/color changes pick matching variant
  useEffect(() => {
    const found = product.variants.find((v) => v.size === size && v.color === color)
    if (found) setVariantId(found.id)
  }, [size, color, product.variants])

  // state to hold front/back mockup URLs
  const [mockups, setMockups] = useState<
    Array<{ placement: string; mockup_url: string }>
  >([])

  // whenever the selected variant changes, re-generate mockups
  useEffect(() => {
    async function refreshMockup() {
      try {
        const res = await fetch("/api/mockups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId:  product.printfulId,
            variantIds: [Number(variant.id)],
            // your original design images
            frontImgUrl: product.images[0],
            backImgUrl:  product.images[1] ?? product.images[0],
          }),
        })
        const { mockups } = await res.json()
        setMockups(mockups)
      } catch (err) {
        console.error("Mockup generation error:", err)
      }
    }

    refreshMockup()
  }, [variant.id, product.printfulId, product.images])

  // find front/back URLs (or fallback placeholder)
  const frontUrl = mockups.find((m) => m.placement === "front")?.mockup_url
  const backUrl  = mockups.find((m) => m.placement === "back")?.mockup_url

  return (
    <>
      <h1 className="font-pixel text-5xl mb-6">{product.title}</h1>

      {product.nsfw ? (
        <NSFWBlock>
          <div className="flex gap-4 justify-center">
            <div className="w-1/2 relative aspect-square">
              <Image
                src={frontUrl || "/placeholder.png"}
                alt="Front mockup"
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <div className="w-1/2 relative aspect-square">
              <Image
                src={backUrl || "/placeholder.png"}
                alt="Back mockup"
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        </NSFWBlock>
      ) : (
        <div className="flex gap-4 justify-center">
          <div className="w-1/2 relative aspect-square">
            <Image
              src={frontUrl || "/placeholder.png"}
              alt="Front mockup"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="w-1/2 relative aspect-square">
            <Image
              src={backUrl || "/placeholder.png"}
              alt="Back mockup"
              fill
              className="object-cover rounded-lg"
            />
          </div>
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
            imageUrl:    frontUrl || "/placeholder.png",
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
