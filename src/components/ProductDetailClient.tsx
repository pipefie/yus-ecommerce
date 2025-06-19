// src/components/ProductDetailClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";

export interface VariantWithImages {
  id:         string;
  color:      string;
  size:       string;
  price:      number;
  designUrls: string[];
}

export interface ProductDetail {
  id:          string;
  title:       string;
  description: string;
  price:       number;
  images:      string[];
  printifyId: string;
  variants:    VariantWithImages[];
}

interface Props {
  product: ProductDetail;
}

export default function ProductDetailClient({ product }: Props) {
  // derive the unique list of colors & sizes
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v: VariantWithImages) => v.color))),
    [product.variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v: VariantWithImages) => v.size))),
    [product.variants]
  );

  // selected state
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  // find the matching variant; fallback to the first variant
  const activeVariant = useMemo(
    () =>
      product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      ) || product.variants[0],
    [selectedColor, selectedSize, product.variants]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* left: carousel */}
      <div>
        <Carousel images={activeVariant.designUrls} />
      </div>

      {/* right: info & selectors */}
      <div>
        <h1 className="text-3xl font-semibold">{product.title}</h1>

        <div
          className="mt-4 text-gray-700 space-y-4"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />

        <div className="mt-6 space-y-4">
          {/* Color selector */}
          <div>
            <label className="block mb-1 font-medium">Color</label>
            <select
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            >
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Size selector */}
          <div>
            <label className="block mb-1 font-medium">Size</label>
            <select
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select size"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="text-2xl font-bold">
            ${(activeVariant.price / 100).toFixed(2)}
          </div>

          {/* Add to cart */}
          <button className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition 
          focus:outline-none focus:ring-2 focus:ring-blue-500">
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => setCurrent(0), [images]);
  if (!images?.length) return null;

  return (
    <div>
      <div className="mb-4">
        <Image
          src={images[current]}
          alt={`View ${current + 1}`}
          width={600}
          height={600}
          className="object-cover w-full h-auto rounded"
        />
      </div>
      <div className="flex space-x-2 overflow-x-auto">
        {images.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            aria-label={`View image ${idx + 1}`}
            className={`ring-2 ${
              idx === current ? "ring-blue-600" : "ring-gray-300"
            } rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <Image
              src={src}
              alt={`Thumbnail ${idx + 1}`}
              width={60}
              height={60}
              className="object-cover rounded-sm"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
