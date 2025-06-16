// src/components/ProductDetailClient.tsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export interface DetailProduct {
  _id:      string;
  title:    string;
  description: string;
  nsfw:     boolean;
  printifyId:number;
  images:   string[];
  price:    number;
  variants: {
    id:     string;
    price:  number;
    size:   string;
    color:  string;
    images: string[];
  }[];
}

export interface SummaryProduct {
  id:        string;
  slug:      string;
  title:     string;
  price:     number;
  thumbnail?:string;
}

interface Props {
  product: DetailProduct;
  relatedProducts?: SummaryProduct[];
}

export default function ProductDetailClient({ product, relatedProducts = [] }: Props) {
  // 1) filter only those with color+size
  const valid = product.variants.filter(v => v.color && v.size);

  // 2) initial variant
  const first = valid[0] ?? product.variants[0];

  // 3) state
  const [selectedColor, setSelectedColor]     = useState(first.color);
  const [selectedSize, setSelectedSize]       = useState(first.size);
  const [selectedVariant, setSelectedVariant] = useState(first);
  const [quantity, setQuantity]               = useState(1);
  const [thumbIdx, setThumbIdx]               = useState(0);

  // 4) update variant when color or size changes
  useEffect(() => {
    const match = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
    if (match) {
      setSelectedVariant(match);
      setThumbIdx(0);
    }
  }, [selectedColor, selectedSize, product.variants]);

  // 5) compute unique colors & sizes
  const uniqueColors = Array.from(new Set(valid.map(v => v.color)));
  const sizesForColor = Array.from(
    new Set(valid.filter(v => v.color === selectedColor).map(v => v.size))
  );

  // 6) enforce fixed size ordering
  const sizeOrder = ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"];
  sizesForColor.sort((a,b) => {
    const ia = sizeOrder.indexOf(a);
    const ib = sizeOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const handleAddToCart = () => {
    console.log("🛒 Add to cart", { variantId: selectedVariant.id, qty: quantity });
    // ← your cart integration goes here
  };

  return (
    <div className="space-y-16">
      {/* — Hero + Thumbnails */}
      <div className="text-center">
        <div className="relative inline-block w-[80vw] sm:w-[60vw] md:w-[40vw] aspect-square">
          <Image
            src={selectedVariant.images[thumbIdx]}
            alt={`${product.title} (${selectedVariant.color} / ${selectedVariant.size})`}
            fill
            sizes="(max-width: 768px) 80vw, (max-width: 1280px) 60vw, 40vw"
            priority
            className="object-cover rounded-lg shadow-lg"
          />
        </div>
        {selectedVariant.images.length > 1 && (
          <div className="mt-4 flex justify-center space-x-3">
            {selectedVariant.images.map((src, i) => (
              <button
                key={i}
                onClick={() => setThumbIdx(i)}
                className={`w-16 h-16 rounded border-2 overflow-hidden ${thumbIdx === i ? "border-white" : "border-gray-600"}`}
              >
                <Image
                  src={src}
                  alt={`view ${i+1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* — Details & Controls */}
      <div className="max-w-5xl mx-auto lg:flex lg:space-x-16">
        {/* Left controls */}
        <div className="lg:w-1/2 space-y-6">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <p className="text-2xl font-semibold">${(selectedVariant.price/100).toFixed(2)}</p>

          {/* Color */}
          <div>
            <span className="font-medium mb-2 block">Color</span>
            <div className="flex flex-wrap gap-3">
              {uniqueColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? "border-white" : "border-gray-600"}`}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <span className="font-medium mb-2 block">Size</span>
            <div className="flex flex-wrap gap-2">
              {sizesForColor.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded ${
                    selectedSize === size ? "border-white bg-white text-black font-semibold" : "border-gray-600"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4 mt-4">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, +e.currentTarget.value))}
              className="w-16 border border-gray-600 rounded px-2 py-1 text-black bg-white"
            />
            <button
              onClick={handleAddToCart}
              className="bg-indigo-600 text-white px-6 py-3 rounded hover:opacity-90 transition"
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Right description */}
        <div className="lg:w-1/2 prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        </div>
      </div>

      {/* Accordions */}
      <div className="max-w-5xl mx-auto divide-y border-y">
        {[
          { title: "Size Guide",    content: <p>Size guide here…</p> },
          { title: "Shipping Info", content: <p>Shipping details…</p> },
          { title: "Return Policy", content: <p>Return policy…</p> },
        ].map(({ title, content }) => (
          <Accordion key={title} title={title}>
            {content}
          </Accordion>
        ))}
      </div>

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {relatedProducts.map(rp => (
              <Link key={rp.id} href={`/products/${rp.slug}`}>
                <a className="block">
                  <div className="relative aspect-square rounded-lg shadow overflow-hidden">
                    <Image
                      src={rp.thumbnail || "/placeholder.png"}
                      alt={rp.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="mt-2 font-medium">{rp.title}</h3>
                  <p className="mt-1">${(rp.price/100).toFixed(2)}</p>
                </a>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="w-full py-4 flex justify-between items-center text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-medium">{title}</span>
        <span className="text-xl">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}
