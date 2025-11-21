// src/components/Navbar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuthUser } from "@/lib/useAuthUser"
import { Plus, X, User, ShoppingCart } from "lucide-react"
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
    { href: "/", label: t("home") },
    { href: "/products", label: t("shop") },
    { href: "/feed", label: t("feed") },
    { href: "/contact", label: t("contact") },
    { href: "/cart", label: t("cart") },
  ]

  const socials = [
    { href: "https://instagram.com/yourbrand", icon: "/icons/instagram.png" },
    { href: "https://tiktok.com/@yourbrand", icon: "/icons/tiktok.png" },
    { href: "https://twitter.com/yourbrand", icon: "/icons/twitter.svg" },
  ]

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 bg-surface/80 backdrop-blur">
        <div className="container-shell flex h-24 items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Y-US? home">
            <Image src="/logoWhite.png" alt="Y-US? Logo" width={70} height={70} priority />
          </Link>

          <ul className="hidden items-center gap-6 text-sm font-semibold uppercase tracking-wide text-white/80 lg:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-neon">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 text-white">
            <LanguageSwitcher />
            <div className="relative">
              <button
                onClick={() => setAuthOpen((o) => !o)}
                className="rounded-full border border-subtle bg-white/5 p-2 transition hover:border-neon hover:text-neon"
                aria-label="Account"
              >
                <User size={22} />
              </button>
              {authOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-subtle bg-surface-soft/95 p-3 text-sm shadow-soft">
                  {!user ? (
                    <>
                      <Link
                        href="/login"
                        className="block rounded-lg px-2 py-1 text-white transition hover:text-neon"
                        onClick={() => setAuthOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/login?prompt=signup"
                        className="block rounded-lg px-2 py-1 text-white transition hover:text-neon"
                        onClick={() => setAuthOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/account"
                        className="block rounded-lg px-2 py-1 text-white transition hover:text-neon"
                        onClick={() => setAuthOpen(false)}
                      >
                        Account
                      </Link>
                      <a
                        href="/auth/logout?returnTo=/"
                        className="block rounded-lg px-2 py-1 text-white transition hover:text-neon"
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
              className="relative rounded-full border border-subtle bg-white/5 p-2 transition hover:border-neon hover:text-neon"
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
              className="rounded-full border border-subtle bg-white/5 p-2 transition hover:border-neon hover:text-neon lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Plus size={22} />}
            </button>
          </div>
        </div>
      </nav>

      <CartSidebar open={open} onClose={() => setOpen(false)} />

      <div
        className={`fixed inset-0 z-40 bg-surface-soft/95 px-6 py-20 transition-transform duration-500 ${
          menuOpen ? "translate-y-0" : "-translate-y-full pointer-events-none"
        }`}
      >
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-between">
          <div className="flex items-center justify-between text-white">
            <p className="text-xs uppercase tracking-[0.5em] text-white/60">Menu</p>
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-full border border-white/20 p-2"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <ul className="space-y-5 text-3xl font-semibold text-white">
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
            <div className="space-y-6 text-white/80">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Socials</p>
              <div className="flex gap-4">
                {socials.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 p-3 transition hover:border-neon/70"
                  >
                    <Image src={social.icon} alt="" width={28} height={28} />
                  </a>
                ))}
              </div>
              <p className="text-xs text-white/50">Weekly drops. Ships from Madrid worldwide.</p>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">© {year} Y-US?</p>
        </div>
      </div>
    </>
  )
}
