// src/context/CartContext.tsx
"use client"
import { createContext, useContext, useState, ReactNode } from "react"
import { Product } from "@/components/ProductCard"

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

  const add = (item: CartItem) => {
    setItems((curr) => {
      const existing = curr.find((i) => i.variantId === item.variantId)
      if (existing) {
        return curr.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...curr, item]
    })
  }

  const remove = (item: CartItem) => {
    setItems((curr) =>
      curr
        .map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity - item.quantity }
            : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  const clear = () => setItems([])

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
