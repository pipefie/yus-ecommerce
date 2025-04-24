// src/app/cart/page.tsx
"use client"
import { useCart } from "@/context/CartContext"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { items, clear } = useCart()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const total = items.reduce((sum, i)=>sum + i.price*i.quantity, 0)/100

  const handleCheckout = async () => {
    setLoading(true)
    const res = await fetch("/api/stripe/checkout", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        items: items.map(({_id,title,price,quantity,imageUrl})=>({
          _id, title, price, quantity, imageUrl
        })),
        customerEmail: (window as any).session?.user?.email,
        userId: (window as any).session?.user?.id,
      }),
    })
    const { url } = await res.json()
    router.push(url)
    clear()
  }

  if (!items.length) return <p className="pt-20 text-center">Your cart is empty</p>

  return (
    <div className="pt-16 container mx-auto px-4 py-8">
      <h1 className="font-pixel text-3xl mb-6">Your Cart</h1>
      <ul className="space-y-4 mb-8">
        {items.map((i)=>(
          <li key={i._id} className="flex justify-between">
            <span>{i.title} × {i.quantity}</span>
            <span>${((i.price*i.quantity)/100).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-bold mb-4">
        <span>Total:</span><span>${total.toFixed(2)}</span>
      </div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-pixel rounded"
      >
        {loading ? "Redirecting…" : "Checkout"}
      </button>
    </div>
  )
}
