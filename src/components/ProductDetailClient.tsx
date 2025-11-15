// src/components/ProductDetailClient.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import ReviewList from "./ReviewList";
import { sendGAEvent } from "@/utils/ga";
import { useCurrency } from "@/context/CurrencyContext";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/eventQueue";

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
  related: RelatedProduct[];
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "\u0024", EUR: "\u20AC", GBP: "\u00A3" };
const SIZE_CHART = [
  { size: "XS", chest: "84 cm", length: "64 cm" },
  { size: "S", chest: "92 cm", length: "67 cm" },
  { size: "M", chest: "100 cm", length: "70 cm" },
  { size: "L", chest: "108 cm", length: "73 cm" },
  { size: "XL", chest: "118 cm", length: "76 cm" },
  { size: "2XL", chest: "128 cm", length: "79 cm" },
];

interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
}

type AccordionSection = {
  id: string;
  title: string;
  content: ReactNode;
};

export default function ProductDetailClient({ product, related }: Props) {
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
    trackEvent("view_product", "product", {
      entityId: product.id,
      metadata: {
        title: product.title,
        printfulId: product.printfulProductId,
        priceCents: product.price,
      },
    });
  }, [product.printfulProductId, product.title, product.price, product.id]);

  const normalizeColor = useCallback((value: string | null | undefined) => value?.trim() || "Default", []);

  const colors = useMemo(() => {
    const unique = Array.from(
      new Set(product.variants.map((variant) => normalizeColor(variant.color))),
    );
    return unique.length ? unique : ["Default"];
  }, [product.variants, normalizeColor]);

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
    () =>
      product.variants.filter((variant) => normalizeColor(variant.color) === selectedColor),
    [product.variants, selectedColor, normalizeColor],
  );

  useEffect(() => {
    if (!colorVariants.some((variant) => variant.size === selectedSize)) {
      setSelectedSize(colorVariants[0]?.size || sizes[0]);
    }
  }, [colorVariants, selectedSize, sizes]);

  const productImageList = useMemo(
    () =>
      (product.images ?? [])
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .map(String),
    [product.images],
  );

  const productImageSet = useMemo(() => new Set(productImageList), [productImageList]);

  const colorImages = useMemo(() => {
    const urls = [
      ...colorVariants.flatMap((variant) => variant.designUrls ?? []),
      ...colorVariants.map((variant) => variant.imageUrl).filter(Boolean),
    ]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map(String);

    const unique = Array.from(new Set(urls));
    const customOnly = unique.filter((url) => !productImageSet.has(url));
    if (customOnly.length) return customOnly;
    if (unique.length) return unique;

    return productImageList.length ? productImageList : ["/placeholder.png"];
  }, [colorVariants, productImageList, productImageSet]);

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

  const onSelectColor = useCallback(
    (color: string) => {
      setSelectedColor(color);
      trackEvent("select_color", "product", {
        entityId: product.id,
        metadata: { color },
      });
    },
    [product.id],
  );

  const onSelectSize = useCallback(
    (size: string) => {
      setSelectedSize(size);
      trackEvent("select_size", "product", {
        entityId: product.id,
        metadata: { size },
      });
    },
    [product.id],
  );

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
    trackEvent("add_to_cart", "product", {
      entityId: product.id,
      metadata: {
        variantId: activeVariant.id,
        color: activeVariant.color,
        size: activeVariant.size,
        priceCents: activeVariant.price,
      },
    });
  };

  const infoSections = useMemo(
    () =>
      [
        {
          id: "description",
          title: "Product description",
          content: (
            <div
              className="prose prose-invert max-w-none text-sm text-slate-300"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ),
        },
        {
          id: "size-chart",
          title: "Size chart",
          content: (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-2">Size</th>
                  <th className="py-2">Chest</th>
                  <th className="py-2">Length</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.map((row) => (
                  <tr key={row.size} className="border-t border-slate-800">
                    <td className="py-2 font-semibold text-slate-200">{row.size}</td>
                    <td className="py-2">{row.chest}</td>
                    <td className="py-2">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        },
        {
          id: "delivery",
          title: "Delivery policy",
          content: (
            <p className="text-sm text-slate-300">
              Orders leave the studio in 2–3 business days. EU deliveries typically arrive within 5–7 days, while
              international shipments may take up to 12 days. You will receive a tracking number as soon as your parcel
              departs.
            </p>
          ),
        },
        {
          id: "returns",
          title: "Returns & exchanges",
          content: (
            <p className="text-sm text-slate-300">
              Need a different size or found an issue? Reach out within 14 days of delivery and we will arrange a swift
              exchange or refund. Items must be unworn, with tags, and returned in the original packaging.
            </p>
          ),
        },
      ] satisfies AccordionSection[],
    [product.description],
  );

  const [openSection, setOpenSection] = useState<string>(infoSections[0]?.id ?? "description");

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Carousel images={colorImages} productId={product.id} />

        <div className="space-y-8 rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-[0_0_60px_rgba(45,212,191,0.05)]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-emerald-300/80">
              <span className="rounded-full border border-emerald-400/40 px-3 py-1">new drop</span>
              <span className="rounded-full border border-emerald-400/40 px-3 py-1">premium cotton</span>
            </div>
            <h1 className="text-4xl font-semibold text-white">{product.title}</h1>
            <p className="text-sm text-slate-400">
              Crafted in micro-batches with breathable materials and eco inks. Built for long nights, bright lights, and
              unexpected adventures.
            </p>
          </div>

          <div className="grid gap-6">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Colorway</p>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => {
                  const preview =
                    product.variants.find((variant) => normalizeColor(variant.color) === color)?.designUrls?.[0] ??
                    (product.images[0] ?? "/placeholder.png");
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onSelectColor(color)}
                      aria-label={`Select color ${color}`}
                      className={`relative h-12 w-12 overflow-hidden rounded-full border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        selectedColor === color ? "border-white" : "border-transparent"
                      }`}
                      title={color}
                    >
                      {preview ? (
                        <Image src={preview} alt={color} fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="absolute inset-0 bg-gray-500" />
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1 text-[10px] text-white">
                        {color}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onSelectSize(size)}
                    aria-pressed={selectedSize === size}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      selectedSize === size
                        ? "border-white bg-white/10 text-white"
                        : "border-slate-700 text-slate-300 hover:border-white"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Price</p>
                <p className="text-4xl font-semibold text-white" aria-live="polite">
                  {currencySymbol}
                  {((activeVariant.price * rate) / 100).toFixed(2)}
                </p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>VAT & duties included</p>
                <p>Ships worldwide</p>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="group inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400/90 px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {t("add_to_cart")}
              <span className="ml-2 transition group-hover:translate-x-1">→</span>
            </button>
          </div>

          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Free support</p>
              <p>DM us anytime for styling or sizing help.</p>
            </div>
            <div className="rounded-2xl border border-slate-800/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Secure checkout</p>
              <p>Protected payments via Stripe & Apple Pay.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Product details</h2>
        <div className="mt-4 divide-y divide-slate-800">
          {infoSections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => setOpenSection((prev) => (prev === section.id ? "" : section.id))}
                  className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-white"
                >
                  {section.title}
                  <span className="text-lg text-emerald-300">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? <div className="pb-4 text-sm text-slate-300">{section.content}</div> : null}
              </div>
            );
          })}
        </div>
      </section>

      <ReviewList productId={product.id} />

      {related.length ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">You might also vibe with</p>
            <h3 className="text-2xl font-semibold text-white">Related drops</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.slug}`}
                className="group rounded-3xl border border-slate-800/80 bg-slate-950/60 p-4 transition hover:-translate-y-1 hover:border-emerald-400/60"
              >
                <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-slate-900">
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="240px" />
                </div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-sm text-slate-400">
                  {currencySymbol}
                  {((item.price * rate) / 100).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Carousel({ images, productId }: { images: string[]; productId: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => setCurrent(0), [images]);
  useEffect(() => {
    if (!images.length) return;
    trackEvent("view_product_image", "product_image", {
      entityId: `${productId}#${current}`,
      metadata: { index: current, total: images.length },
    });
  }, [current, images, productId]);

  if (!images?.length) return null;

  const prev = () =>
    setCurrent((value) => {
      const nextIndex = (value - 1 + images.length) % images.length;
      return nextIndex;
    });
  const next = () =>
    setCurrent((value) => {
      const nextIndex = (value + 1) % images.length;
      return nextIndex;
    });

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
