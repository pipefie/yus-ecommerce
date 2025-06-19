// src/context/CartContext.tsx
"use client"
import { createContext, useContext, useState, ReactNode } from "react"
import { Product } from "@/components/ProductCard"

export interface CartItem extends Product {  
  _id:       string 
  variantId: string
  quantity:  number }

interface CartContextValue {
  items: CartItem[]
  add:     (item: CartItem) => void      // now takes a CartItem
  remove:  (variantId: string) => void   // drop by variant
  clear:   () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const add = (item: CartItem) => {
    setItems((cur) => {
      const exists = cur.find(
        (i) => i._id === item._id && i.variantId === item.variantId
      )
      if (exists) {
        return cur.map((i) =>
          i._id === item._id && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...cur, item]
    })
  }
  const remove = (variantId: string) =>
    setItems((cur)=> cur.filter((i)=>i.variantId !== variantId))

  const clear = ()=>setItems([])
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
