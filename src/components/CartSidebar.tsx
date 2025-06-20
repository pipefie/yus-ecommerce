'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'

export default function CartSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { items, remove, clear } = useCart()
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  return (
    <>
      {/* Full-screen backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          z-50`}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 right-0 w-full md:w-1/3 bg-white transform transition-transform
          ${open ? 'translate-x-0' : 'translate-x-full'}
          z-60 flex flex-col`}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-2xl font-semibold">Your Cart</h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div
                key={`${item.slug}-${item.variantId}`}
                className="flex items-start space-x-4"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Qty: <span className="font-medium">{item.quantity}</span>
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    €{((item.price * item.quantity) / 100).toFixed(2)}
                  </p>
                  <button
                    onClick={() => remove(item.variantId)}
                    className="mt-2 text-sm text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <footer className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium">Subtotal</span>
              <span className="text-lg font-semibold">
                €{(subtotal / 100).toFixed(2)}
              </span>
            </div>
            <Link href="/checkout">
              <p className="block w-full text-center bg-green-800 text-white py-3 rounded-lg font-semibold hover:bg-green-900 transition">
                Securely Checkout
              </p>
            </Link>
            <button
              onClick={clear}
              className="mt-3 block w-full text-center text-red-500 hover:underline"
            >
              Clear Cart
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}
