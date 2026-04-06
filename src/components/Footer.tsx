'use client'

import Link from "next/link"
import { useActionState } from "react"
import { subscribeToNewsletterAction } from "@/actions/newsletter"

const INITIAL = { success: false, error: '' }

export default function Footer() {
  const [state, formAction, isPending] = useActionState(subscribeToNewsletterAction, INITIAL)

  return (
    <footer className="border-t border-white/10 bg-black px-4 py-12 text-white">
      <div className="container mx-auto grid gap-10 md:grid-cols-3">
        {/* Brand & Tagline */}
        <div className="space-y-4">
          <h3 className="font-pixel text-xl text-white">Y-US?</h3>
          <p className="max-w-xs text-sm text-slate-400">Minimal design meets unfiltered chaos. Crafted in limited batches.</p>
        </div>

        {/* Navigation Links */}
        <div>
          <h4 className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-500">Explore</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link href="/" className="transition hover:text-emerald-300">Home</Link>
            </li>
            <li>
              <Link href="/products" className="transition hover:text-emerald-300">Shop Drop</Link>
            </li>
            <li>
              <Link href="/feed" className="transition hover:text-emerald-300">Social Feed</Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-emerald-300">Contact</Link>
            </li>
            <li className="pt-2">
              <Link href="/privacy-policy" className="text-slate-500 transition hover:text-emerald-300">Privacy</Link>
            </li>
            <li>
              <Link href="/terms" className="text-slate-500 transition hover:text-emerald-300">Terms</Link>
            </li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h4 className="mb-4 text-xs uppercase tracking-[0.2em] text-emerald-300">Stay Updated</h4>
          {state.success ? (
            <p className="text-sm text-emerald-300">you&apos;re on the list.</p>
          ) : (
            <form action={formAction} className="flex flex-col gap-3">
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-emerald-400 focus:outline-none"
              />
              {state.error && (
                <p className="text-xs text-red-400">{state.error}</p>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-2xl bg-emerald-400/90 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
              >
                {isPending ? 'Joining…' : 'Join the list'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Y-US? — All Rights Reserved.
      </div>
    </footer>
  )
}
