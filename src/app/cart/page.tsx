// src/app/cart/page.tsx
"use client"
import { useCart } from "@/context/CartContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCurrency } from "../../context/CurrencyContext"
import { useTranslations } from "next-intl"
import fetchWithCsrf from "../../utils/fetchWithCsrf"

export default function CartPage() {
  const { items, clear } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { currency, rate } = useCurrency()
  const symbols: Record<string,string> = { USD: '$', EUR: '€', GBP: '£' }
  const t = useTranslations()
  interface SessionData {
    user?: { email?: string; id?: string }
  }
  const session = (window as unknown as { session?: SessionData }).session

  const total = (items.reduce((sum, i)=>sum + i.price*i.quantity, 0)/100) * rate

  const handleCheckout = async () => {
    setLoading(true)
    setError("")
    const res = await fetchWithCsrf("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({
        items: items.map(({ _id, slug, title, price, quantity, imageUrl }) => ({
          _id,
          slug,
          title,
          price: Math.round(price * rate),
          quantity,
          imageUrl,
        })),
        currency,
        customerEmail: session?.user?.email,
        userId: session?.user?.id,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setError(data.error || "Checkout failed")
      setLoading(false)
      return
    }
    router.push(data.url)
    clear()
  }

  if (!items.length) return <p className="pt-20 text-center">{t('your_cart')} is empty</p>

  return (
    <div className="pt-16 container mx-auto px-4 py-8">
      <h1 className="font-pixel text-3xl mb-6">{t('your_cart')}</h1>
      <ul className="space-y-4 mb-8">
        {items.map((i)=>(
          <li key={i.variantId} className="flex justify-between">
            <span>{i.title} × {i.quantity}</span>
            <span>{symbols[currency] || ''}{((i.price*i.quantity*rate)/100).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-bold mb-4">
        <span>Total:</span><span>{symbols[currency] || ''}{total.toFixed(2)}</span>
      </div>
      {error && (
        <p className="text-red-500 text-sm mb-2 font-pixel">{error}</p>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-pixel rounded"
      >
        {loading ? "Redirecting…" : t('checkout')}
      </button>
    </div>
  )
}
