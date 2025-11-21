'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import getCsrfHeader from '@/utils/getCsrfHeader'
import { Section } from '@/components/ui/layout'

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
    <Section as="main" padding="wide" className="min-h-screen pt-24 text-foreground bg-surface-soft">
      <div className="w-full space-y-8">
        <div className="rounded-3xl border border-subtle bg-card/80 p-6 shadow-soft space-y-4">
          <h2 className="font-bold text-foreground uppercase tracking-wide">
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

        <div className="flex items-center text-muted">
          <div className="flex-1 h-px bg-border/60" />
          <span className="px-4">OR</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        <div className="rounded-3xl border border-subtle bg-card/80 p-6 shadow-soft space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="font-bold uppercase text-foreground">Contact</h2>
            <Link
              href={`/login?returnTo=${encodeURIComponent('/checkout')}`}
              className="text-sm text-neon hover:underline"
            >
              Log in
            </Link>
          </div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
          />
          <label className="flex items-center text-sm text-muted">
            <input
              type="checkbox"
              checked={subscribe}
              onChange={e => setSubscribe(e.target.checked)}
              className="h-4 w-4 text-neon border-subtle rounded"
            />
            <span className="ml-2">Email me with news and offers</span>
          </label>
        </div>

        <div className="rounded-3xl border border-subtle bg-card/80 p-6 shadow-soft space-y-4">
          <h2 className="font-bold uppercase text-foreground">Delivery</h2>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
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
              className="border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
            />
            <input
              placeholder="Last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
            />
          </div>
          <input
            placeholder="Company (optional)"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="w-full border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
          />
          <input
            placeholder="Address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
          />
          <input
            placeholder="Apartment, suite, etc. (optional)"
            value={apt}
            onChange={e => setApt(e.target.value)}
            className="w-full border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
          />
          <div className="grid grid-cols-3 gap-4">
            <input
              placeholder="Postal code"
              value={postal}
              onChange={e => setPostal(e.target.value)}
              className="border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
            />
            <input
              placeholder="City"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
            />
            <select
              value={province}
              onChange={e => setProvince(e.target.value)}
              className="border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
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
            className="w-full border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
          />
          <label className="flex items-center text-sm text-muted">
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={e => setSaveInfo(e.target.checked)}
              className="h-4 w-4 text-neon border-subtle rounded"
            />
            <span className="ml-2">Save this information for next time</span>
          </label>
        </div>

        <div className="rounded-3xl border border-subtle bg-card/70 p-6 text-muted italic shadow-soft">
          Enter your shipping address to view available shipping methods.
        </div>

        <div className="rounded-3xl border border-subtle bg-card/80 p-6 shadow-soft space-y-4">
          <h2 className="font-bold uppercase text-foreground">Payment</h2>
          <p className="text-xs text-muted">All transactions are secure and encrypted.</p>

          <label className="flex items-center border border-green-700 rounded-full px-4 py-2 bg-surface text-foreground">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="h-4 w-4 text-neon border-subtle"
            />
            <span className="ml-2 flex-1">Credit card</span>
            <div className="flex space-x-2">
              <Image src="/visa.svg" alt="Visa" width={32} height={20} />
              <Image src="/mc.svg" alt="Mastercard" width={32} height={20} />
              <Image src="/amex.svg" alt="Amex" width={32} height={20} />
              <div className="px-2 text-sm text-muted">+6</div>
            </div>
          </label>
          {paymentMethod === 'card' && (
            <div className="space-y-2">
              <input
                placeholder="Card number"
                className="w-full border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
              />
              <div className="flex gap-4">
                <input
                  placeholder="MM / YY"
                  className="flex-1 border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
                />
                <input
                  placeholder="CVC"
                  className="flex-1 border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
                />
              </div>
              <input
                placeholder="Name on card"
                className="w-full border border-subtle rounded-full px-4 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-neon/80"
              />
              <label className="flex items-center text-sm text-muted">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-neon border-subtle rounded"
                  defaultChecked
                />
                <span className="ml-2">Use shipping address as billing address</span>
              </label>
            </div>
          )}

          <label className="flex items-center border border-subtle rounded-full px-4 py-2 bg-surface text-foreground">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'paypal'}
              onChange={() => setPaymentMethod('paypal')}
              className="h-4 w-4 text-neon border-subtle"
            />
            <span className="ml-2 flex-1">PayPal</span>
            <Image src="/paypal-logo.png" alt="PayPal" width={64} height={20} />
          </label>

          <label className="flex items-center border border-subtle rounded-full px-4 py-2 bg-surface text-foreground">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'crypto'}
              onChange={() => setPaymentMethod('crypto')}
              className="h-4 w-4 text-neon border-subtle"
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

        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}
        <button
          onClick={handleReview}
          className="w-full py-3 bg-neon text-slate-950 font-bold rounded-lg hover:brightness-105 transition"
        >
          Review order
        </button>

        <div className="flex justify-center space-x-6 text-xs text-muted pt-8">
          <Link href="/refund-policy">Refund policy</Link>
          <Link href="/privacy-policy">Privacy policy</Link>
          <Link href="/terms-of-service">Terms of service</Link>
        </div>
      </div>

    </Section>
  )
}
