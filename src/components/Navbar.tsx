// src/components/Navbar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession, signIn, signOut } from "next-auth/react"
import { Plus, X, User } from "lucide-react"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/CartContext"
import CartSidebar from "./CartSidebar"

export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const { items } = useCart()
  const [open, setOpen] = useState(false)
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/feed", label: "Feed" },
    { href: "/contact", label: "Contact" },
  ]

  const socials = [
    { href: "https://instagram.com/yourbrand", icon: "/icons/instagram.png" },
    { href: "https://tiktok.com/@yourbrand", icon: "/icons/tiktok.png" },
    { href: "https://twitter.com/yourbrand", icon: "/icons/twitter.svg" },
  ]

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-30 flex items-center justify-between p-4 bg-black/70 backdrop-blur">
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
                {!session ? (
                  <>
                    <Link
                      href="/auth/signin"
                      className="block px-2 py-1 text-white font-pixel hover:text-neon"
                      onClick={() => setAuthOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block px-2 py-1 text-white font-pixel hover:text-neon"
                      onClick={() => setAuthOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => { signOut(); setAuthOpen(false) }}
                    className="w-full text-left px-2 py-1 text-white font-pixel hover:text-neon"
                  >
                    Sign Out
                  </button>
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
          <CartSidebar open={open} onClose={() => setOpen(false)} />
        </div>

      </nav>

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
