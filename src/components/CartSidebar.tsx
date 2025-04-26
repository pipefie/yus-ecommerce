// src/components/CartSidebar.tsx
"use client"
import Link from "next/link"
import { X } from "lucide-react"
import { useCart } from "@/context/CartContext"

export default function CartSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { items, remove, clear } = useCart()

  return (
    <div
      className={[
        "fixed inset-y-0 right-0 w-80 transform transition-transform z-50",
        open ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
    >
      <div className="h-full flex flex-col bg-gray-900 text-white shadow-2xl">
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="font-pixel text-xl">Your Cart</h2>
          <button onClick={onClose} aria-label="Close cart">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-gray-400">Nothing in your cart yet.</p>
          ) : (
            items.map((i) => (
              <div
                key={i._id + i.variantId}
                className="flex items-center space-x-3"
              >
                <img
                  src={i.imageUrl}
                  alt={i.title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{i.title}</h3>
                  <p className="text-sm text-gray-300">
                    {i.quantity} × ${(i.price / 100).toFixed(2)}
                  </p>
                  <button
                    onClick={() => remove(i._id)}
                    className="text-red-500 text-xs mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <footer className="p-4 border-t border-gray-700">
            <Link href="/cart">
              <a className="block w-full mb-2 bg-neon text-black py-2 rounded font-pixel text-center">
                Checkout
              </a>
            </Link>
            <button
              onClick={clear}
              className="w-full text-center text-red-500 mt-2"
            >
              Clear Cart
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}
