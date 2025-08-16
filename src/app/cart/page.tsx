"use client"

import { useCart } from "@/context/CartContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/context/CurrencyContext"
import { useTranslations } from "next-intl"
import fetchWithCsrf from "@/utils/fetchWithCsrf"

export default function CartPage() {
  const { items, clear } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { currency, rate } = useCurrency() // UI-only (server charges EUR)
  const t = useTranslations()

  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" }
  const total = (items.reduce((sum, i) => sum + i.price * i.quantity, 0) / 100) * rate

  async function handleCheckout() {
    try {
      setLoading(true)
      setError("")
      const res = await fetchWithCsrf("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // send only non-trusted fields; server will re-validate with Prisma
          items: items.map(({ _id, variantId, quantity }) => ({ _id, variantId, quantity })),
          currency, // for display parity; server will force EUR
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.url) throw new Error(data?.error || "Checkout failed")
      clear()
      router.push(data.url)
    } catch (e: any) {
      setError(e?.message ?? "Checkout failed")
      setLoading(false)
    }
  }

  if (!items.length) {
    return <p className="pt-20 text-center">{t('cart_empty')}</p>
  }

  return (
    <div className="pt-16 container mx-auto px-4 py-8">
      <h1 className="font-pixel text-3xl mb-6">{t("your_cart")}</h1>

      <ul className="space-y-4 mb-8">
        {items.map(i => (
          <li key={i.variantId ?? i._id} className="flex justify-between">
            <span>{i.title} × {i.quantity}</span>
            <span>{symbols[currency] ?? ""}{((i.price * i.quantity * rate) / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between font-bold mb-4">
        <span>Total:</span>
        <span>{symbols[currency] ?? ""}{total.toFixed(2)}</span>
      </div>

      {error && <p className="text-red-500 text-sm mb-2 font-pixel">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-pixel rounded"
      >
        {loading ? "Redirecting…" : t("checkout")}
      </button>
    </div>
  )
}
