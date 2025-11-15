// src/components/Navbar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuthUser } from "@/lib/useAuthUser"
import { Plus, X, User } from "lucide-react"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/CartContext"
import CartSidebar from "./CartSidebar"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "./LanguageSwitcher"

export default function Navbar() {
  const { user } = useAuthUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const { items } = useCart()
  const [open, setOpen] = useState(false)
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
  const year = new Date().getFullYear()

  const t = useTranslations()

  const links = [
    { href: "/", label: t('home') },
    { href: "/products", label: t('shop') },
    { href: "/feed", label: t('feed') },
    { href: "/contact", label: t('contact') },
    { href: "/cart", label: t('cart') },
  ]

  const socials = [
    { href: "https://instagram.com/yourbrand", icon: "/icons/instagram.png" },
    { href: "https://tiktok.com/@yourbrand", icon: "/icons/tiktok.png" },
    { href: "https://twitter.com/yourbrand", icon: "/icons/twitter.svg" },
  ]

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="glass-panel flex h-20 items-center justify-between rounded-2xl px-4 py-3 shadow-[0_20px_50px_rgba(2,8,23,0.7)] sm:px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center" aria-label="Y-US? home">
                <Image src="/logoWhite.png" alt="Y-US? Logo" width={56} height={56} priority />
              </Link>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Y-US?</span>
                <span className="text-sm text-white/80">Minimal design, unfiltered chaos.</span>
              </div>
            </div>

            <ul className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-200">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-neon"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="hidden lg:inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-neon hover:text-neon"
              >
                <span className="h-2 w-2 rounded-full bg-neon shadow-[0_0_10px_var(--color-neon)]" />
                New Drop
              </Link>
              <LanguageSwitcher />
              <div className="relative">
                <button
                  onClick={() => setAuthOpen((o) => !o)}
                  className="rounded-full bg-white/5 p-2 text-neon transition hover:bg-white/10"
                  aria-label="Account"
                >
                  <User size={22} />
                </button>
                {authOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-black/90 p-3 text-sm backdrop-blur">
                    {!user ? (
                      <>
                        <Link
                          href="/login"
                          className="block rounded-lg px-3 py-2 text-white transition hover:bg-white/5"
                          onClick={() => setAuthOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/login?prompt=signup"
                          className="block rounded-lg px-3 py-2 text-white transition hover:bg-white/5"
                          onClick={() => setAuthOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/account"
                          className="block rounded-lg px-3 py-2 text-white transition hover:bg-white/5"
                          onClick={() => setAuthOpen(false)}
                        >
                          Account
                        </Link>
                        <a
                          href="/auth/logout?returnTo=/"
                          className="block rounded-lg px-3 py-2 text-white transition hover:bg-white/5"
                          onClick={() => setAuthOpen(false)}
                        >
                          Sign Out
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setOpen(true)}
                className="relative rounded-full bg-white/5 p-2 text-neon transition hover:bg-white/10"
                aria-label="Open cart"
              >
                <ShoppingCart size={22} />
                {totalQty > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neon text-[11px] font-semibold text-black">
                    {totalQty}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-full bg-neon/10 p-2 text-neon transition hover:bg-neon/20 lg:hidden"
                aria-label="Menu"
              >
                {menuOpen ? <X size={22} /> : <Plus size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <CartSidebar open={open} onClose={() => setOpen(false)} />

      <div
        className={`fixed inset-0 z-40 bg-[#03040a]/95 px-6 py-20 transition-all duration-500 ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="mx-auto flex h-full max-w-4xl flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Navigation</p>
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-full border border-white/20 p-2 text-white transition hover:text-neon"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <ul className="space-y-4 text-3xl font-semibold">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-neon"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-6 text-sm text-slate-300">
              <p className="section-kicker text-xs text-slate-500">Socials</p>
              <div className="flex gap-4">
                {socials.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/15 p-3 transition hover:border-neon/60"
                  >
                    <Image src={s.icon} alt="" width={28} height={28} />
                  </a>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Drop status</p>
                <p className="mt-2 text-lg font-semibold text-neon">Weekly limited tees</p>
                <p className="text-slate-400">Ships from Madrid → Worldwide</p>
              </div>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-600">© {year} Y-US?</p>
        </div>
      </div>
    </>
  )
}
