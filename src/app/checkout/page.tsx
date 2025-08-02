'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import getCsrfHeader from '@/utils/getCsrfHeader'

export default function CheckoutPage() {
  const { items, clear } = useCart()
  const router = useRouter()

  // Redirect empty carts
  useEffect(() => {
    if (items.length === 0) router.push('/')
  }, [items, router])

  const [email, setEmail] = useState('')
  const [subscribe, setSubscribe] = useState(true)
  const [country, setCountry] = useState('Spain')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [address, setAddress] = useState('')
  const [apt, setApt] = useState('')
  const [postal, setPostal] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('Gipuzkoa')
  const [phone, setPhone] = useState('')
  const [saveInfo, setSaveInfo] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card')
  const [error, setError] = useState('')
  
  const handleReview = async () => {
    setError('')
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await getCsrfHeader() },
      body: JSON.stringify({
        items: items.map(({ slug, title, price, quantity, imageUrl }) => ({
          slug,
          title,
          price,
          quantity,
          imageUrl,
        })),
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setError(data.error || 'Checkout failed')
      return
    }
    clear()
    router.push(data.url)
  }

  return (
    <main className="min-h-screen pt-24 bg-gray-50 flex">
      {/* Left column */}
      <div className="w-full lg:w-2/3 p-8 space-y-8">
        {/* Express checkout */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="font-bold text-gray-700 uppercase tracking-wide">
            Express checkout
          </h2>
          <div className="flex space-x-4">
            <button className="flex-1 py-3 bg-yellow-400 rounded-lg text-blue-800 font-semibold">
              <Image src="/paypal-logo.png" alt="PayPal" width={100} height={24} />
            </button>
            <button className="flex-1 py-3 bg-black rounded-lg text-white font-semibold">
              <Image src="/gpay-logo.png" alt="GPay" width={100} height={24} />
            </button>
          </div>
        </div>

        {/* OR divider */}
        <div className="flex items-center text-gray-400">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="px-4">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Contact */}
        <div className="bg-white p-6 rounded-lg shadow space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="font-bold uppercase text-gray-700">Contact</h2>
            <button className="text-sm text-green-700 hover:underline">Log in</button>
          </div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          />
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={subscribe}
              onChange={e => setSubscribe(e.target.checked)}
              className="h-4 w-4 text-green-700 border-gray-300 rounded"
            />
            <span className="ml-2">Email me with news and offers</span>
          </label>
        </div>

        {/* Delivery */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="font-bold uppercase text-gray-700">Delivery</h2>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          >
            <option>Spain</option>
            <option>France</option>
            <option>Germany</option>
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="First name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
            />
            <input
              placeholder="Last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
            />
          </div>
          <input
            placeholder="Company (optional)"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          />
          <input
            placeholder="Address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          />
          <input
            placeholder="Apartment, suite, etc. (optional)"
            value={apt}
            onChange={e => setApt(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-4">
            <input
              placeholder="Postal code"
              value={postal}
              onChange={e => setPostal(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
            />
            <input
              placeholder="City"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
            />
            <select
              value={province}
              onChange={e => setProvince(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
            >
              <option>Gipuzkoa</option>
              <option>Madrid</option>
              <option>Barcelona</option>
            </select>
          </div>
          <input
            placeholder="Phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          />
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={e => setSaveInfo(e.target.checked)}
              className="h-4 w-4 text-green-700 border-gray-300 rounded"
            />
            <span className="ml-2">Save this information for next time</span>
          </label>
        </div>

        {/* Shipping Methods */}
        <div className="bg-white p-6 rounded-lg shadow text-gray-600 italic">
          Enter your shipping address to view available shipping methods.
        </div>

        {/* Payment */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="font-bold uppercase text-gray-700">Payment</h2>
          <p className="text-xs text-gray-600">All transactions are secure and encrypted.</p>

          {/* Credit Card */}
          <label className="flex items-center border border-green-700 rounded-full px-4 py-2">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="h-4 w-4 text-green-700 border-gray-300"
            />
            <span className="ml-2 flex-1">Credit card</span>
            <div className="flex space-x-2">
              <Image src="/visa.svg" alt="Visa" width={32} height={20} />
              <Image src="/mc.svg" alt="Mastercard" width={32} height={20} />
              <Image src="/amex.svg" alt="Amex" width={32} height={20} />
              <div className="px-2 text-sm text-gray-500">+6</div>
            </div>
          </label>
          {paymentMethod === 'card' && (
            <div className="space-y-2">
              <input
                placeholder="Card number"
                className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
              />
              <div className="flex gap-4">
                <input
                  placeholder="MM / YY"
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
                />
                <input
                  placeholder="CVC"
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
                />
              </div>
              <input
                placeholder="Name on card"
                className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
              />
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-green-700 border-gray-300 rounded"
                  defaultChecked
                />
                <span className="ml-2">Use shipping address as billing address</span>
              </label>
            </div>
          )}

          {/* PayPal */}
          <label className="flex items-center border border-gray-300 rounded-full px-4 py-2">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'paypal'}
              onChange={() => setPaymentMethod('paypal')}
              className="h-4 w-4 text-green-700 border-gray-300"
            />
            <span className="ml-2 flex-1">PayPal</span>
            <Image src="/paypal-logo.png" alt="PayPal" width={64} height={20} />
          </label>

          {/* Crypto */}
          <label className="flex items-center border border-gray-300 rounded-full px-4 py-2">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'crypto'}
              onChange={() => setPaymentMethod('crypto')}
              className="h-4 w-4 text-green-700 border-gray-300"
            />
            <span className="ml-2 flex-1">Other Payments</span>
          </label>
          {paymentMethod === 'crypto' && (
            <div className="flex space-x-4 mt-2">
              <Image src="/btc.svg" alt="Bitcoin" width={32} height={32} />
              <Image src="/eth.svg" alt="Ethereum" width={32} height={32} />
              <Image src="/usdt.svg" alt="USDT" width={32} height={32} />
            </div>
          )}
        </div>

        {/* Review Order */}
        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}
        <button
          onClick={handleReview}
          className="w-full py-3 bg-green-800 text-white font-bold rounded-lg hover:bg-green-900 transition"
        >
          Review order
        </button>

        {/* Footer Links */}
        <div className="flex justify-center space-x-6 text-xs text-gray-500 pt-8">
          <Link href="/refund-policy">Refund policy</Link>
          <Link href="/privacy-policy">Privacy policy</Link>
          <Link href="/terms-of-service">Terms of service</Link>
        </div>
      </div>

      {/* Right summary can go here if you wish */}
    </main>
  )
}
