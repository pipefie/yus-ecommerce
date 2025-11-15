// src/app/page.tsx
import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import AnimatedShapes from "@/components/AnimatedShapes";
import ProductGrid from "@/components/ProductGrid";
import Image from "next/image";
import { getTranslations } from 'next-intl/server'
import { getAllProducts } from "../lib/products";
import { cookies } from 'next/headers';
import { getAssetUrls, assetPlaceholder } from "@/lib/assets";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Y-US? Home",
    description: "Minimal design meets unfiltered chaos.",
  };
}

const SOCIAL_POSTS = [
  {
    platform: "Instagram",
    icon: "/icons/instagram.png",
    title: "Drop prep from the studio",
    handle: "@y-us.shop",
    url: "https://instagram.com/yourbrand",
  },
  {
    platform: "TikTok",
    icon: "/icons/tiktok.png",
    title: "Printing day timelapse",
    handle: "@y-us.shop",
    url: "https://tiktok.com/@yourbrand",
  },
  {
    platform: "X / Twitter",
    icon: "/icons/twitter.svg",
    title: "Weekly Q&A clips",
    handle: "@y-us.shop",
    url: "https://twitter.com/yourbrand",
  },
]

export default async function HomePage() {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en'
  const t = await getTranslations({ locale: lang})
  const products = await getAllProducts();

  const items = products.map((p) => {
    const productImages = getAssetUrls(
      p.productImages
        .filter((img) => !img.variantId)
        .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
        .map((img) => img.url),
      { fallback: assetPlaceholder() }
    );

    const variantWithPrice = p.variants.find((vv) => Number.isFinite(vv.price)) ?? p.variants[0] ?? null;
    const imageUrl = productImages[0] ?? assetPlaceholder();

    return {
      slug: p.slug,
      title: p.title,
      description: p.description,
      price: variantWithPrice?.price ?? p.price,
      imageUrl,
    };
  });

  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <AnimatedShapes />

      <section
        id="products"
        className="relative z-10 mx-auto max-w-6xl px-4 py-16"
      >
        <div className="text-center">
          <p className="section-kicker text-neon">{t('featured_tees')}</p>
          <h2 className="mt-3 text-3xl font-semibold">Featured tees</h2>
          <p className="mt-3 text-sm text-slate-300">
            Latest drop, refreshed weekly.
          </p>
        </div>
        <div className="mt-10">
          {/* @ts-expect-error: already serialized */}
          <ProductGrid products={items} />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16">
        <div className="text-center">
          <p className="section-kicker text-neon">Social feed</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Social posts</h2>
          <p className="mt-3 text-sm text-slate-300">Instagram, TikTok, and X updates.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIAL_POSTS.map((post) => (
            <a
              key={post.platform}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-white transition hover:border-neon"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-white/20 p-2">
                  <Image src={post.icon} alt={post.platform} width={20} height={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{post.platform}</p>
                  <p className="text-xs text-white/60">{post.handle}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/80">{post.title}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm text-neon">
                Open {post.platform}
                <span aria-hidden className="transition group-hover:translate-x-1">→</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
