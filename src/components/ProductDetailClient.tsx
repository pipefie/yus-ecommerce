// src/components/ProductDetailClient.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import NSFWBlock from "@/components/NSFWBlock";
import { useCart, CartItem } from "@/context/CartContext";

export interface Variant {
  id:         string;
  price:      number;    // cents
  size?:      string;
  color?:     string;
  images: string[];
}

export interface DetailProduct {
  _id:         string;
  title:       string;
  description: string;
  nsfw:        boolean;
  printifyId:  number;
  images:      string[];
  variants:    Variant[];
  price:       number;
}

export default function ProductDetailClient({ product }: { product: DetailProduct }) {
  const { add } = useCart();

  // --- Selection state
  const [selectedSize, setSelectedSize]   = useState(product.variants[0].size || "");
  const [selectedColor, setSelectedColor] = useState(product.variants[0].color || "");
  const [variantId, setVariantId] = useState(product.variants[0].id)
  const [imageIdx, setImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1)
  const variant = product.variants.find((v) => v.id === variantId)!

  // Recompute variant when size/color change
  useEffect(() => {
    const match = product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );
    if (match) setVariantId(match.id);
  }, [selectedSize, selectedColor, product.variants]);

  useEffect(() => setImageIdx(0), [variantId]);

  // Unique option lists
  const sizes  = Array.from(new Set(product.variants.map((v) => v.size))).filter(Boolean) as string[];
  const colors = Array.from(new Set(product.variants.map((v) => v.color))).filter(Boolean) as string[];

  // Price display
  const imgUrl = variant.images[imageIdx] || variant.images[0];
  const displayPrice = ((variant.price * quantity) / 100).toFixed(2)


  return (
    <div className="space-y-8">
      <h1 className="font-pixel text-4xl mb-4">{product.title}</h1>

      {/* IMAGE + THUMBNAILS */}
      <div>
        <div className="relative w-full aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden mb-4">
          {product.nsfw ? (
            <NSFWBlock>
              <Image 
                src={imgUrl} 
                alt={product.title} 
                width={500}
                height={500}
                className="rounded-lg transition duration-300" />
            </NSFWBlock>
          ) : (
            <Image 
              src={imgUrl} 
              alt={product.title} 
              width={500}
              height={500}
              className="rounded-lg transition duration-300" />
          )}

        <div className="grid grid-cols-4 gap-2 mt-4">
          {variant.images.map((img, idx) => (
            <button key={idx} onClick={() => setImageIdx(idx)}>
              <Image
                src={img}
                alt={`${product.title} view ${idx}`}
                width={80}
                height={80}
                className={`rounded border transition-transform duration-200 ${imageIdx===idx?'ring-2 ring-neon scale-105':'opacity-75 hover:opacity-100'}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* PRICE */}
      <p className="text-2xl font-bold">€{displayPrice}</p>

      {/* SELECTORS */}
      <div className="grid grid-cols-2 gap-4">
        {/* Size */}
        <div>
          <label className="block mb-1 font-medium">Size</label>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {/* Quantity */}
        <div>
          <label className="block mb-1 font-medium">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border rounded px-3 py-2 w-20"
          />
        </div>
        {/* Color */}
        <div>
          <label className="block mb-1 font-medium">Color</label>
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-2xl font-bold mb-6">
        {displayPrice} €
      </p>
      {/* QUANTITY + ADD TO CART */}
      <div className="flex items-center space-x-4">
        {/* Quantity */}
        <div className="flex items-center border rounded overflow-hidden">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="px-3 py-2 text-lg"
          >−</button>
          <span className="px-4 py-2">{quantity}</span>
          <button
            onClick={() => setQuantity(q => q + 1)}
            className="px-3 py-2 text-lg"
          >+</button>
        </div>
        {/* Add */}
        <button
          onClick={() => {
            const item: CartItem = {
              _id:         product._id,
              title:       product.title,
              description: product.description,
              price:       variant.price,
              imageUrl:    imgUrl,
              nsfw:        product.nsfw,
              variantId:   variant.id,
              quantity,
            };
            add(item);
          }}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded text-center font-medium"
        >
          Add to Cart
        </button>
      </div>

      {/* DESCRIPTION */}
      <div className="prose prose-invert overflow-x-auto description-container">
        <div dangerouslySetInnerHTML={{ __html: product.description }} />
      </div>
      <style jsx>{`
        .description-container table {
          width: 100%;
          border-collapse: collapse;
        }
        .description-container th,
        .description-container td {
          border: 1px solid #555;
          padding: 8px;
          color: #e5e7eb;
        }
        .description-container th {
          background: #1f2937;
        }
      `}</style>
    </div>
  </div>
  );
}

