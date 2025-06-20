'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart, CartItem } from '@/context/CartContext'

export default function CartSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { items, add, remove, clear } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const { url } = await res.json()
      clear()
      window.location.href = url
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* blurred backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-50 transition-opacity ${
          open ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* sliding panel */}
      <aside
        className={`fixed inset-y-0 right-0 w-full md:w-1/3 bg-white shadow-lg z-60 transform transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* header */}
        <header className="flex items-center justify-between px-8 py-6 border-b text-black">
          <h2 className="text-lg font-bold uppercase tracking-wide">Cart ({items.length})</h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </header>

        {/* items */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 divide-y">
          {items.length === 0 && <p className="text-gray-500">Your cart is empty.</p>}
          {items.map((item: CartItem) => (
            <div key={item.variantId} className="flex space-x-4 py-4 text-black">
              <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-black">{item.title}</h3>
                <div className="mt-2 flex items-center space-x-2">
                  {/* decrement */}
                  <button
                    onClick={() => remove({ ...item, quantity: 1 })}
                    className="w-8 h-8 flex items-center justify-center border rounded text-black hover:bg-gray-100"
                  >
                    –
                  </button>
                  <span className="text-sm font-medium">{item.quantity}</span>
                  {/* increment */}
                  <button
                    onClick={() => add({ ...item, quantity: 1 })}
                    className="w-8 h-8 flex items-center justify-center border rounded text-black hover:bg-gray-100"
                  >
                    +
                  </button>
                  {/* remove line */}
                  <button
                    onClick={() => {
                      // remove until gone
                      while (item.quantity > 0) {
                        remove(item)
                        item.quantity--
                      }
                    }}
                    className="ml-auto text-xs text-gray-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-2 text-sm font-bold text-black">
                  €{((item.price * item.quantity) / 100).toFixed(2)} EUR
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        {items.length > 0 && (
          <footer className="px-8 py-6 border-t">
            <div className="flex justify-between mb-2 text-black">
              <span className="font-bold">Total</span>
              <span className="font-bold">€{(subtotal / 100).toFixed(2)} EUR</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Delivery calculated at checkout</p>
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className={`w-full py-3 text-white font-bold rounded-lg ${
                isLoading ? 'bg-gray-400 cursor-wait' : 'bg-black hover:bg-gray-800'
              } transition`}
            >
              {isLoading ? 'Processing…' : 'Check out'}
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}
