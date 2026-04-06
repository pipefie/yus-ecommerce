'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useCart, CartItem } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { useTranslations } from 'next-intl'
import fetchWithCsrf from '@/utils/fetchWithCsrf'

export default function CartSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { items, add, remove, clear } = useCart()
  const { currency, rate } = useCurrency()
  const symbols: Record<string,string> = { USD: '$', EUR: '€', GBP: '£' }
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0)* rate

  const handleCheckout = async () => {
    setError('')
    setIsLoading(true)
    try {
      const res = await fetchWithCsrf('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
          items: items.map(i => ({
            ...i,
            price: Math.round(i.price * rate)
          })),
          currency
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Checkout failed')
        setIsLoading(false)
        return
      }
      clear()
      window.location.href = data.url
    } catch {
      setError('Checkout failed')
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
        className={`fixed inset-y-0 right-0 w-full md:w-1/3 bg-[#0a0a0a] border-l border-slate-800 shadow-2xl z-60 transform transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-slate-800 text-slate-100">
          <h2 className="text-lg font-bold uppercase tracking-widest">Cart ({items.length})</h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded hover:bg-slate-800 transition text-slate-400 hover:text-slate-100"
          >
            <X size={24} />
          </button>
        </header>

        {/* items */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 divide-y divide-slate-800">
          {items.length === 0 && <p className="text-slate-500">{t('cart_empty')}</p>}
          {items.map((item: CartItem) => (
            <div key={item.variantId} className="flex space-x-4 py-4 text-slate-100">
              <div className="w-24 h-24 bg-slate-900 rounded overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                <div className="mt-2 flex items-center space-x-2">
                  {/* decrement */}
                  <button
                    onClick={() => remove({ ...item, quantity: 1 })}
                    className="w-8 h-8 flex items-center justify-center border border-slate-700 rounded text-slate-100 hover:bg-slate-800 transition"
                  >
                    –
                  </button>
                  <span className="text-sm font-medium text-slate-100">{item.quantity}</span>
                  {/* increment */}
                  <button
                    onClick={() => add({ ...item, quantity: 1 })}
                    className="w-8 h-8 flex items-center justify-center border border-slate-700 rounded text-slate-100 hover:bg-slate-800 transition"
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
                    className="ml-auto text-xs text-slate-500 hover:text-slate-300 hover:underline transition"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-100">
                  {symbols[currency] || ''}{((item.price * item.quantity * rate)/100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        {items.length > 0 && (
          <footer className="px-8 py-6 border-t border-slate-800">
            <div className="flex justify-between mb-2 text-slate-100">
              <span className="font-bold uppercase tracking-widest text-sm">Total</span>
              <span className="font-bold">{symbols[currency] || ''}{(subtotal / 100).toFixed(2)}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Delivery calculated at checkout</p>
            {error && (
              <p className="text-red-400 text-sm mb-2">{error}</p>
            )}
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className={`w-full py-3 font-semibold uppercase tracking-widest rounded-lg transition ${
                isLoading
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-emerald-400/90 text-black hover:bg-emerald-300'
              }`}
            >
              {isLoading ? 'Processing…' : t('checkout')}
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}
