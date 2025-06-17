// src/components/ProductDetailClient.tsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export interface VariantWithImages {
  id: string;
  price: number;
  size: string;
  color: string;
  images: string[];     // now an array
}

export interface DetailProduct {
  _id:        string;
  title:      string;
  description:string;   // HTML
  price:      number;   // cents
  images:     string[]; // fallback gallery
  printifyId: string;
  variants:   VariantWithImages[];
}

interface Props {
  product: DetailProduct;
  relatedProducts: any[]; // keep as you had
}

export default function ProductDetailClient({ product }: Props) {
  // build unique lists
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const sizes  = Array.from(new Set(product.variants.map((v) => v.size)));

  // controlled
  const [color, setColor] = useState(colors[0]);
  const [size,  setSize]  = useState(sizes[0]);

  // find matching variant
  const variant =
    product.variants.find((v) => v.color === color && v.size === size)
    ?? product.variants[0];

  // main carousel image
  const [main, setMain] = useState(variant.images[0] || product.images[0]);

  // when variant changes, reset main
  useEffect(() => {
    setMain(variant.images[0] || product.images[0]);
  }, [variant, product.images]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="md:flex gap-12">
        {/* === IMAGES === */}
        <div className="flex-shrink-0">
          <div className="border p-4 mb-4">
            <Image
              src={main}
              alt={product.title}
              width={600}
              height={600}
              className="object-contain"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(variant.images.length ? variant.images : product.images).map((url) => (
              <button
                key={url}
                onClick={() => setMain(url)}
                className={`border-2 rounded ${
                  url === main ? "border-blue-500" : "border-gray-700"
                }`}
              >
                <Image src={url} alt="" width={80} height={80} className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* === DETAILS === */}
        <div className="flex-1 text-white">
          <h1 className="text-2xl font-semibold mb-2">{product.title}</h1>
          <p className="text-xl font-bold mb-4">${(product.price/100).toFixed(2)}</p>

          {/* safe HTML render */}
          <div
            className="prose prose-invert max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

          {/* selectors */}
          <div className="flex gap-6 mb-6">
            <div>
              <label className="block mb-1 text-sm">Color</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="bg-black text-white border border-gray-600 px-3 py-2 rounded"
              >
                {colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="bg-black text-white border border-gray-600 px-3 py-2 rounded"
              >
                {sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
