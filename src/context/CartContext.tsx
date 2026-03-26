// src/context/CartContext.tsx
"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { trackEvent } from "@/lib/analytics/eventQueue"

export interface CartItem {
  _id: string
  slug: string
  title: string
  description: string
  price: number
  imageUrl: string
  variantId: string
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  add:     (item: CartItem) => void      // now takes a CartItem
  remove:  (item: CartItem) => void   // drop by variant
  clear:   () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Hydrate cart from localStorage on first load
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("cart")
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])
  
  const add = (item: CartItem) => {
    setItems((curr) => {
      let next: CartItem[]
      let newQuantity = item.quantity
      const existing = curr.find((i) => i.variantId === item.variantId)
      if (existing) {
        next = curr.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
        newQuantity = existing.quantity + item.quantity
      } else {
        next = [...curr, item]
      }
      trackEvent("cart_add", "cart_item", {
        entityId: item.variantId,
        metadata: {
          productId: item._id,
          title: item.title,
          quantityAdded: item.quantity,
          newQuantity,
          priceCents: item.price,
        },
      })
      return next
    })
  }

  const remove = (item: CartItem) => {
    setItems((curr) => {
      let newQuantity = 0
      const next = curr
        .map((i) => {
          if (i.variantId === item.variantId) {
            const updated = Math.max(0, i.quantity - item.quantity)
            newQuantity = updated
            return { ...i, quantity: updated }
          }
          return i
        })
        .filter((i) => i.quantity > 0)

      trackEvent("cart_remove", "cart_item", {
        entityId: item.variantId,
        metadata: {
          productId: item._id,
          title: item.title,
          quantityRemoved: item.quantity,
          newQuantity,
        },
      })

      return next
    })
  }

  const clear = () => {
    setItems((curr) => {
      if (curr.length) {
        trackEvent("cart_clear", "cart", {
          metadata: {
            itemCount: curr.length,
          },
        })
      }
      return []
    })
  }

  return (
    <CartContext.Provider value={{ items, add, remove, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be in CartProvider")
  return ctx
}
