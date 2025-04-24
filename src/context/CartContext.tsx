// src/context/CartContext.tsx
"use client"
import { createContext, useContext, useState, ReactNode } from "react"
import { Product } from "@/components/ProductCard"

interface CartItem extends Product { quantity: number }

interface CartContextValue {
  items: CartItem[]
  add:   (p: Product)=>void
  remove:(id:string)=>void
  clear: ()=>void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const add = (p: Product) => {
    setItems((cur) => {
      const exist = cur.find((i) => i._id===p._id)
      return exist
        ? cur.map((i)=>(i._id===p._id?{...i,quantity:i.quantity+1}:i))
        : [...cur, { ...p, quantity:1 }]
    })
  }
  const remove = (id:string) =>
    setItems((cur)=> cur.filter((i)=>i._id!==id))
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
