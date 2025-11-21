"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { useTranslations } from "next-intl";
import fetchWithCsrf from "@/utils/fetchWithCsrf";
import { trackEvent } from "@/lib/analytics/eventQueue";

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

export default function CartPage() {
  const { items, clear, add, remove } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { currency, rate } = useCurrency();
  const t = useTranslations();

  const subtotal = (items.reduce((sum, item) => sum + item.price * item.quantity, 0) / 100) * rate;
  const shippingEstimate = items.length ? 0 : 0;
  const total = subtotal + shippingEstimate;

  useEffect(() => {
    trackEvent("view_cart", "cart", {
      metadata: {
        itemCount: items.length,
        totalCents: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      },
    });
  }, [items]);

  async function handleCheckout() {
    trackEvent("checkout_start", "cart", {
      metadata: {
        itemCount: items.length,
        totalCents: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      },
    });
    try {
      setLoading(true);
      setError("");
      const response = await fetchWithCsrf("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ _id, variantId, quantity }) => ({ _id, variantId, quantity })),
          currency,
        }),
      });
      const data: { url?: string; error?: string } = await response.json();
      if (!response.ok || !data?.url) throw new Error(data?.error || "Checkout failed");
      clear();
      trackEvent("checkout_redirect", "cart", { metadata: { url: data.url } });
      router.push(data.url);
    } catch (unknownError: unknown) {
      const message = unknownError instanceof Error ? unknownError.message : "Checkout failed";
      trackEvent("checkout_error", "cart", { metadata: { message } });
      setError(message);
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <main className="min-h-screen bg-surface-soft pt-20 pb-24 text-foreground">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-lg rounded-3xl border border-subtle bg-surface-soft/80 p-10 text-center shadow-soft">
            <p className="text-sm uppercase tracking-[0.4em] text-muted">{t("your_cart")}</p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">Your cart is empty</h1>
            <p className="mt-3 text-muted">
              Looks like you haven’t picked your next obsession yet. Explore new drops and come back with loot.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-2xl bg-emerald-400/90 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-soft pt-20 pb-24 text-foreground">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted">{t("your_cart")}</p>
            <h1 className="mt-2 text-4xl font-semibold text-foreground">Ready to checkout?</h1>
          </div>
          <button
            onClick={clear}
            className="text-sm text-muted underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Clear cart
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-4">
            {items.map((item) => {
              const lineTotal = ((item.price * item.quantity) / 100) * rate;
              return (
                <article
                  key={item.variantId ?? item._id}
                  className="flex flex-col gap-4 rounded-3xl border border-subtle bg-surface-soft/80 p-4 shadow-soft sm:flex-row"
                >
                  <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-surface sm:h-32 sm:w-32">
                    <Image
                      src={item.imageUrl || "/placeholder.png"}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-muted">{item.slug}</p>
                        <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted line-clamp-2">{item.description}</p>
                      </div>
                      <button
                        onClick={() => remove({ ...item, quantity: item.quantity })}
                        className="text-xs text-muted underline-offset-4 transition hover:text-neon hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => remove({ ...item, quantity: 1 })}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-subtle text-lg text-foreground transition hover:border-neon"
                        >
                          −
                        </button>
                        <span className="w-12 text-center text-lg font-semibold text-foreground">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => add({ ...item, quantity: 1 })}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-subtle text-lg text-foreground transition hover:border-neon"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-lg font-semibold">
                        {CURRENCY_SYMBOLS[currency] ?? ""}
                        {lineTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="space-y-6 rounded-3xl border border-subtle bg-surface-soft/80 p-6 shadow-soft">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Order summary</h2>
              <p className="text-sm text-muted">Shipping & taxes calculated at checkout.</p>
            </div>

            <dl className="space-y-3 text-sm text-muted">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>
                  {CURRENCY_SYMBOLS[currency] ?? ""}
                  {subtotal.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{shippingEstimate === 0 ? "Included" : `${CURRENCY_SYMBOLS[currency] ?? ""}${shippingEstimate.toFixed(2)}`}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Rewards</dt>
                <dd className="text-emerald-300">+200 pts</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between border-t border-subtle pt-4">
              <span className="text-sm uppercase tracking-[0.2em] text-muted">Total</span>
              <span className="text-3xl font-semibold text-foreground">
                {CURRENCY_SYMBOLS[currency] ?? ""}
                {total.toFixed(2)}
              </span>
            </div>

            {error ? <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">{error}</p> : null}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-400/90 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {loading ? "Processing…" : t("checkout")}
            </button>

            <div className="rounded-2xl border border-subtle p-4 text-sm text-muted">
              <p className="font-semibold text-foreground">Need help?</p>
              <p>We can edit your order up to 2 hours after checkout. Just reply to the confirmation email.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
