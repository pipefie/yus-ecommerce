"use client"

import { useCart } from "@/context/CartContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/context/CurrencyContext"
import { useTranslations } from "next-intl"
import fetchWithCsrf from "@/utils/fetchWithCsrf"

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" }

export default function CartPage() {
  const { items, clear } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { currency, rate } = useCurrency() // UI-only (server charges EUR)
  const t = useTranslations()

  const total = (items.reduce((sum, item) => sum + item.price * item.quantity, 0) / 100) * rate

  async function handleCheckout() {
    try {
      setLoading(true)
      setError("")
      const response = await fetchWithCsrf("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ _id, variantId, quantity }) => ({ _id, variantId, quantity })),
          currency,
        }),
      })
      const data: { url?: string; error?: string } = await response.json()
      if (!response.ok || !data?.url) throw new Error(data?.error || "Checkout failed")
      clear()
      router.push(data.url)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Checkout failed"
      setError(message)
      setLoading(false)
    }
  }

  if (!items.length) {
    return <p className="pt-20 text-center">{t('cart_empty')}</p>
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <h1 className="font-pixel text-3xl mb-6">{t("your_cart")}</h1>

      <ul className="mb-8 space-y-4">
        {items.map((item) => (
          <li key={item.variantId ?? item._id} className="flex justify-between">
            <span>{item.title} × {item.quantity}</span>
            <span>{CURRENCY_SYMBOLS[currency] ?? ""}{((item.price * item.quantity * rate) / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="mb-4 flex justify-between font-bold">
        <span>Total:</span>
        <span>{CURRENCY_SYMBOLS[currency] ?? ""}{total.toFixed(2)}</span>
      </div>

      {error && <p className="mb-2 text-sm font-pixel text-red-500">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full rounded bg-indigo-600 py-3 font-pixel text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Processing..." : t("checkout")}
      </button>
    </div>
  )
}
