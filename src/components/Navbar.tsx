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
      <nav className="fixed inset-x-0 top-0 z-50 flex h-24 items-center justify-between border-b border-white/10 bg-black px-6 backdrop-blur-md">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logoWhite.png"
            alt="Y_US? Logo"
            width={70}
            height={70}
            priority
            className="opacity-90 transition hover:opacity-100"
          />
        </Link>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <LanguageSwitcher />
          {/* User Icon & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAuthOpen((o) => !o)}
              className="p-2 text-slate-300 transition hover:text-white"
              aria-label="Account"
            >
              <User size={24} />
            </button>
            {authOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-black p-2 shadow-2xl">
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      onClick={() => setAuthOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/login?prompt=signup"
                      className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      onClick={() => setAuthOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Optional: show Account when logged in */}
                    <Link
                      href="/account"
                      className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      onClick={() => setAuthOpen(false)}
                    >
                      Account
                    </Link>
                    <a
                      href="/auth/logout?returnTo=/"
                      className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      onClick={() => setAuthOpen(false)}
                    >
                      Sign Out
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Menu Toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 text-slate-300 transition hover:text-white"
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Plus size={24} />}
          </button>
          {/* Cart */}
          <button
            onClick={() => setOpen(true)}
            className="relative p-2 text-slate-300 transition hover:text-white"
            aria-label="Open cart"
          >
            <ShoppingCart size={24} />
            {totalQty > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                {totalQty}
              </span>
            )}
          </button>
        </div>

      </nav>

      {/* Cart Sidebar (moved outside nav) */}
      <CartSidebar open={open} onClose={() => setOpen(false)} />
      {/*<CurrencySwitcher />*/}

      {/* Full-screen Overlay Menu */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/95 transition-transform duration-500 ease-in-out ${menuOpen ? "translate-y-0" : "-translate-y-full"
          }`}
      >
        <ul className="space-y-8 text-center">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-3xl font-semibold text-slate-300 transition hover:text-white hover:tracking-wide"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-16 flex space-x-8">
          {socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:scale-110"
            >
              <Image src={s.icon} alt="" width={24} height={24} />
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
