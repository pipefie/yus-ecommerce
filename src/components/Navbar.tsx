// src/components/Navbar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession, signIn, signOut } from "next-auth/react"
import { Plus, X } from "lucide-react"

export default function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/feed", label: "Shitpost Feed" },
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
        {/* Logo only */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Y_US? Logo"
            width={48}
            height={48}
            priority
          />
        </Link>

        {/* Toggle button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 text-neon hover:text-neon/70 transition"
        >
          {open ? <X size={28} /> : <Plus size={28} />}
        </button>
      </nav>

      {/* Overlay Menu */}
      <div
        className={`fixed inset-0 z-20 bg-black flex flex-col items-center justify-center transform ${
          open ? "translate-y-0" : "-translate-y-full"
        } transition-transform duration-500 ease-in-out`}
      >
        <ul className="space-y-6 text-center">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-4xl font-pixel text-white hover:text-neon transition"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            {session ? (
              <button
                onClick={() => { signOut(); setOpen(false) }}
                className="text-4xl font-pixel text-white hover:text-neon transition"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => { signIn(); setOpen(false) }}
                className="text-4xl font-pixel text-white hover:text-neon transition"
              >
                Sign In / Up
              </button>
            )}
          </li>
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
                <img
                src={s.icon}
                alt={s.href.split("//")[1].split("/")[0]}
                width={32}
                height={32}
                />
            </a>
            ))}
        </div>
      </div>
    </>
  )
}
