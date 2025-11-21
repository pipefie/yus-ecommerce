// src/app/products/page.tsx
import ShopClient from "@/components/ShopClient";
import { getAllProducts } from "@/lib/products";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getAssetUrls, assetPlaceholder } from "@/lib/assets";
import { Section } from "@/components/ui/layout";
import { Eyebrow, SectionTitle, BodyText } from "@/components/ui/typography";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shop Our Tees | Y-US?",
    description: "Browse our full catalog of custom tees.",
  };
}

export default async function ProductsPage() {
  const cookie = await cookies();
  const lang = cookie.get("language")?.value || "en";
  const t = await getTranslations({ locale: lang });
  const products = await getAllProducts();

  const initialProducts = products.map((p) => {
    const productImages = getAssetUrls(
      p.productImages
        .filter((img) => !img.variantId)
        .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
        .map((img) => img.url),
      { fallback: assetPlaceholder() },
    );

    const imageUrl = productImages[0] ?? assetPlaceholder();
    const variantWithPrice =
      p.variants.find((vv) => Number.isFinite(vv.price)) ?? p.variants[0] ?? null;
    const price = variantWithPrice?.price ?? p.price;

    return {
      _id: String(p.id),
      slug: p.slug,
      title: p.title,
      description: p.description,
      price,
      imageUrl,
      nsfw: false,
      updatedAt: p.updatedAt,
    };
  });

  return (
    <div className="relative min-h-screen bg-surface-soft pt-32 text-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(80,90,120,0.24), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08), transparent 45%), radial-gradient(circle at 60% 80%, rgba(60,180,130,0.18), transparent 60%)",
        }}
      />
      <Section className="relative z-10">
        <div className="glass-panel mb-10 rounded-3xl border border-subtle bg-card p-8 text-center shadow-soft">
          <Eyebrow align="center" className="text-neon">{t("shop_our_tees")}</Eyebrow>
          <SectionTitle align="center">Shop all tees</SectionTitle>
          <BodyText tone="muted" className="mt-3 text-center">
            Browse every product, filter by category, and find the size that fits you best.
          </BodyText>
        </div>
        <div className="rounded-3xl border border-subtle bg-surface-soft/70 p-6 backdrop-blur">
          {/* @ts-expect-error: already serialized */}
          <ShopClient initialProducts={initialProducts} />
        </div>
      </Section>
    </div>
  );
}
