// src/components/Navbar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@auth0/nextjs-auth0"
import { Plus, X, User } from "lucide-react"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/CartContext"
import CartSidebar from "./CartSidebar"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "./LanguageSwitcher"

export default function Navbar() {
  const { user } = useUser()
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
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 h-24 bg-black/70 backdrop-blur">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logoWhite.png"
            alt="Y_US? Logo"
            width={70}
            height={70}
            priority
          />
        </Link>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <LanguageSwitcher />
          {/* User Icon & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAuthOpen((o) => !o)}
              className="p-2 text-neon hover:text-neon/70 transition"
              aria-label="Account"
            >
              <User size={28} />
            </button>
              {authOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-black/90 backdrop-blur p-3 rounded-lg shadow-neon">
                  {!user ? (
                    <>
                      <Link
                        href="/signin"
                        className="block px-2 py-1 text-white font-pixel hover:text-neon"
                        onClick={() => setAuthOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-2 py-1 text-white font-pixel hover:text-neon"
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
                        className="block px-2 py-1 text-white font-pixel hover:text-neon"
                        onClick={() => setAuthOpen(false)}
                      >
                        Account
                      </Link>
                      <a
                        href="/auth/logout?returnTo=/"
                        className="block px-2 py-1 text-white font-pixel hover:text-neon"
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
            className="p-2 text-neon hover:text-neon/70 transition"
            aria-label="Menu"
          >
            {menuOpen ? <X size={28} /> : <Plus size={28} />}
          </button>
          {/* Cart */}
          <button
            onClick={() => setOpen(true)}
            className="relative p-2 text-neon"
            aria-label="Open cart"
          >
            <ShoppingCart size={24} />
            {totalQty > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
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
        className={`fixed inset-0 z-20 bg-black flex flex-col items-center justify-center transform ${
          menuOpen ? "translate-y-0" : "-translate-y-full"
        } transition-transform duration-500 ease-in-out`}
      >
        <ul className="space-y-6 text-center">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-4xl font-pixel text-white hover:text-neon transition"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex space-x-6">
          {socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition"
            >
              <Image src={s.icon} alt="" width={32} height={32} />
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
