// src/components/ProductDetailClient.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import ReviewList from "./ReviewList";
import { sendGAEvent } from "@/utils/ga";
import { useCurrency } from "@/context/CurrencyContext";
import { useTranslations } from "next-intl";

export interface VariantWithImages {
  id:         string;
  color:      string;
  size:       string;
  price:      number;
  designUrls: string[];
  imageUrl?:  string;
  previewUrl?: string;
}

export interface ProductDetail {
  id:          string;
  title:       string;
  description: string;
  price:       number;
  images:      string[];
  printfulProductId: string;
  variants:    VariantWithImages[];
}

interface Props {
  product: ProductDetail;
}

export default function ProductDetailClient({ product }: Props) {
  const { add } = useCart()
  useEffect(() => {
    sendGAEvent('view_item', {
      items: [
        {
          item_id: product.printfulProductId,
          item_name: product.title,
          price: product.price / 100,
        },
      ],
    })
  }, [product.printfulProductId, product.title, product.price])
  const { currency, rate } = useCurrency()
  const symbols: Record<string,string> = { USD: '$', EUR: '€', GBP: '£' }
  const t = useTranslations()
  // derive the unique list of colors & sizes
  const colors = useMemo(() => {
    const arr = Array.from(new Set(product.variants.map((v) => (v.color || '').trim())));
    return arr.length ? arr : ['Default']
  }, [product.variants]);
  const sizes = useMemo(() => {
    const arr = Array.from(new Set(product.variants.map((v) => (v.size || '').trim())));
    // Sort sizes in a friendly order if possible
    const order = ['XXS','XS','S','M','L','XL','2XL','XXL','3XL','4XL','5XL'];
    return (arr.length ? arr : ['One Size']).sort((a,b) => {
      const ia = order.indexOf(a.toUpperCase());
      const ib = order.indexOf(b.toUpperCase());
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [product.variants]);

  // selected state
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  // variants available for the chosen color
  const colorVariants = useMemo(
    () => product.variants.filter((v) => v.color === selectedColor),
    [product.variants, selectedColor]
  );

  // ensure chosen size exists for the color
  useEffect(() => {
    if (!colorVariants.some((v) => v.size === selectedSize)) {
      setSelectedSize(colorVariants[0]?.size || sizes[0]);
    }
  }, [selectedColor, colorVariants, selectedSize, sizes]);

  // all unique mockups for the selected color, with robust fallbacks
  const colorImages = useMemo(() => {
    // Accept any http(s) image; backend now guarantees these are mockups
    const isAllowedHost = (u: string) => {
      try {
        const p = new URL(u).protocol;
        return p === 'https:' || p === 'http:';
      } catch {
        return false;
      }
    };

    const urls = [
      // Prefer explicit design/mockup URLs from the variant
      ...colorVariants.flatMap((v) => Array.isArray(v.designUrls) ? v.designUrls : []),
      // Fallback to variant imageUrl if present
      ...colorVariants.map((v: any) => (v as any).imageUrl).filter(Boolean),
    ]
      .filter(Boolean)
      .map(String)
      .filter(isAllowedHost) as string[];

    const unique = Array.from(new Set(urls));
    const fallbacks = (product.images || []).filter(isAllowedHost);
    return unique.length ? unique : (fallbacks.length ? fallbacks : ["/placeholder.png"]);
  }, [colorVariants, product.images]);

  // find the matching variant; fallback to the first variant
  const activeVariant = useMemo(() => {
    return (
      product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize && (v.designUrls?.length || (v as any).imageUrl)
      ) || product.variants.find((v) => v.color === selectedColor) || product.variants[0] || {
        id: 'fallback',
        color: 'Default',
        size: 'One Size',
        price: product.price,
        designUrls: product.images?.length ? [product.images[0]] : [],
      }
    )
  }, [selectedColor, selectedSize, product.variants, product.price, product.images])

  const onSelectColor = useCallback((c: string) => {
    setSelectedColor(c)
  }, [])

    const handleAdd = () => {
      const imageUrl = colorImages[0] || product.images[0] || "/placeholder.png";
      add({
        _id:        product.id,
        slug:       product.id,
        title:      product.title,
        description:product.description,
        price:      activeVariant.price,
        imageUrl,
        variantId:  activeVariant.id,
        quantity:   1,
        });
      sendGAEvent('add_to_cart', {
        items: [
          {
            item_id: product.printfulProductId,
            item_name: product.title,
            price: activeVariant.price / 100,
            quantity: 1,
          },
        ],
        })
    };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* left: carousel */}
      <div className="md:sticky md:top-24 self-start">
        <Carousel 
          images={
            colorImages
          }
        />
      </div>

      {/* right: info & selectors */}
      <div>
        <h1 className="text-3xl font-semibold">{product.title}</h1>

        <div className="mt-6 space-y-4">
          {/* Color selector (swatches) */}
          <div>
            <label className="block mb-2 font-medium">Color: <span className="text-gray-400">{selectedColor}</span></label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const v = product.variants.find(v => v.color === c)
                const preview = v?.designUrls?.[0] || v?.imageUrl || product.images?.[0]
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onSelectColor(c)}
                    aria-label={`Select color ${c}`}
                    className={`relative h-10 w-10 rounded-full ring-2 transition ${selectedColor === c ? 'ring-white' : 'ring-gray-600'} overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    title={c}
                  >
                    {preview ? (
                      <Image src={preview} alt={c} fill sizes="40px" className="object-cover" unoptimized />
                    ) : (
                      <span className="absolute inset-0 bg-gray-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Size selector */}
          <div>
            <label className="block mb-2 font-medium">Size</label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  aria-pressed={selectedSize === s}
                  className={`px-3 py-2 rounded border transition ${selectedSize === s ? 'border-white bg-gray-800' : 'border-gray-600 hover:border-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="text-2xl font-bold" aria-live="polite">
            {symbols[currency] || ''}{((activeVariant.price * rate) / 100).toFixed(2)}
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            className="min-w-full text-neon text-white py-3 rounded 
            hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('add_to_cart')}
          </button>

        <div
          className="mt-4 text-gray-700 space-y-4"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
        <ReviewList productId={product.id} />
        </div>
      </div>
    </div>
  );
}

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => setCurrent(0), [images]);
  if (!images?.length) return null;

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)

  return (
    <div className="relative">
      <div className="mb-4 group relative overflow-hidden rounded">
        <Image
          src={images[current]}
          alt={`Product image ${current + 1}`}
          width={900}
          height={900}
          priority
          className="object-cover w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
          unoptimized
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-9 w-9 flex items-center justify-center"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-9 w-9 flex items-center justify-center"
            >
              ›
            </button>
          </>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto w-full" aria-label="Image thumbnails">
        {images.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            aria-current={idx === current}
            aria-label={`View image ${idx + 1}`}
            className={`ring-2 ${idx === current ? 'ring-white' : 'ring-transparent'} rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          >
            <Image
              src={src}
              alt={`Thumbnail ${idx + 1}`}
              width={72}
              height={72}
              className="object-cover rounded-sm w-[72px] h-[72px]"
              unoptimized
            />
          </button>
        ))}
      </div>
    </div>
  );
}
