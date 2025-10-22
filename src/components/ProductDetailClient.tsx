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
  id: string;
  color: string;
  size: string;
  price: number;
  designUrls: string[];
  imageUrl?: string;
  previewUrl?: string;
}

export interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  printfulProductId: string;
  variants: VariantWithImages[];
}

interface Props {
  product: ProductDetail;
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "\u0024", EUR: "\u20AC", GBP: "\u00A3" };

export default function ProductDetailClient({ product }: Props) {
  const { add } = useCart();
  const { currency, rate } = useCurrency();
  const t = useTranslations();
  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? "";

  useEffect(() => {
    sendGAEvent("view_item", {
      items: [
        {
          item_id: product.printfulProductId,
          item_name: product.title,
          price: product.price / 100,
        },
      ],
    });
  }, [product.printfulProductId, product.title, product.price]);

  const colors = useMemo(() => {
    const unique = Array.from(new Set(product.variants.map((variant) => variant.color.trim())));
    return unique.length ? unique : ["Default"];
  }, [product.variants]);

  const sizes = useMemo(() => {
    const unique = Array.from(new Set(product.variants.map((variant) => variant.size.trim())));
    const order = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "4XL", "5XL"];
    if (!unique.length) return ["One Size"];
    return unique.sort((a, b) => {
      const ia = order.indexOf(a.toUpperCase());
      const ib = order.indexOf(b.toUpperCase());
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [product.variants]);

  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  const colorVariants = useMemo(
    () => product.variants.filter((variant) => variant.color === selectedColor),
    [product.variants, selectedColor]
  );

  useEffect(() => {
    if (!colorVariants.some((variant) => variant.size === selectedSize)) {
      setSelectedSize(colorVariants[0]?.size || sizes[0]);
    }
  }, [colorVariants, selectedSize, sizes]);

  const colorImages = useMemo(() => {
    const urls = [
      ...colorVariants.flatMap((variant) => variant.designUrls ?? []),
      ...colorVariants.map((variant) => variant.imageUrl).filter(Boolean),
    ]
      .filter(Boolean)
      .map(String);

    const unique = Array.from(new Set(urls));
    if (unique.length) return unique;

    const fallbacks = (product.images ?? []).filter(Boolean);
    return fallbacks.length ? fallbacks : ["/placeholder.png"];
  }, [colorVariants, product.images]);

  const activeVariant = useMemo(() => {
    const preferred = product.variants.find(
      (variant) =>
        variant.color === selectedColor &&
        variant.size === selectedSize &&
        ((variant.designUrls && variant.designUrls.length > 0) || variant.imageUrl)
    );
    if (preferred) return preferred;

    const sameColor = product.variants.find((variant) => variant.color === selectedColor);
    if (sameColor) return sameColor;

    return product.variants[0] ?? {
      id: "fallback",
      color: "Default",
      size: "One Size",
      price: product.price,
      designUrls: product.images.length ? [(product.images[0] ?? "/placeholder.png")] : [],
      imageUrl: (product.images[0] ?? "/placeholder.png"),
      previewUrl: (product.images[0] ?? "/placeholder.png"),
    };
  }, [product.variants, product.price, product.images, selectedColor, selectedSize]);

  const onSelectColor = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  const handleAdd = () => {
    const imageUrl = colorImages[0] || (product.images[0] ?? "/placeholder.png") || "/placeholder.png";
    add({
      _id: product.id,
      slug: product.id,
      title: product.title,
      description: product.description,
      price: activeVariant.price,
      imageUrl,
      variantId: activeVariant.id,
      quantity: 1,
    });
    sendGAEvent("add_to_cart", {
      items: [
        {
          item_id: product.printfulProductId,
          item_name: product.title,
          price: activeVariant.price / 100,
          quantity: 1,
        },
      ],
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <Carousel images={colorImages} />

      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">{product.title}</h1>
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const preview =
                  product.variants.find((variant) => variant.color === color)?.designUrls?.[0] ??
                  (product.images[0] ?? "/placeholder.png");
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onSelectColor(color)}
                    aria-label={`Select color ${color}`}
                    className={`relative h-10 w-10 overflow-hidden rounded-full ring-2 transition ${
                      selectedColor === color ? 'ring-white' : 'ring-gray-600'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    title={color}
                  >
                    {preview ? (
                      <Image src={preview} alt={color} fill sizes="40px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 bg-gray-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">Size</label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selectedSize === size}
                  className={`rounded border px-3 py-2 transition ${
                    selectedSize === size ? 'border-white bg-gray-800' : 'border-gray-600 hover:border-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="text-2xl font-bold" aria-live="polite">
            {currencySymbol}{((activeVariant.price * rate) / 100).toFixed(2)}
          </div>

          <button
            onClick={handleAdd}
            className="w-full rounded bg-neutral-900 py-3 text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('add_to_cart')}
          </button>
        </div>

        <ReviewList productId={product.id} />
      </div>
    </div>
  );
}

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => setCurrent(0), [images]);

  if (!images?.length) return null;

  const prev = () => setCurrent((value) => (value - 1 + images.length) % images.length);
  const next = () => setCurrent((value) => (value + 1) % images.length);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded">
        <Image
          src={images[current]}
          alt={`Product image ${current + 1}`}
          width={900}
          height={900}
          priority
          className="h-auto w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white transition hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white transition hover:bg-black/70"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto" aria-label="Image thumbnails">
        {images.map((src, idx) => (
          <button
            key={`${src}-${idx}`}
            onClick={() => setCurrent(idx)}
            aria-current={idx === current}
            aria-label={`View image ${idx + 1}`}
            className={`ring-2 ${idx === current ? 'ring-white' : 'ring-transparent'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          >
            <Image src={src} alt={`Thumbnail ${idx + 1}`} width={72} height={72} className="h-[72px] w-[72px] object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
