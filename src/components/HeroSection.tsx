"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import ScrollTrigger from "gsap/dist/ScrollTrigger"

const HERO_STATS = [
  { label: "Orders shipped", value: "24K+" },
  { label: "Artists collabed", value: "38" },
  { label: "Drops / year", value: "12" },
]

const HERO_FEATURES = [
  { label: "Drop 07", value: "Chaos Bloom" },
  { label: "Fabric", value: "Heavyweight organic cotton" },
  { label: "Mood", value: "Alt-Andean neon" },
]

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    if (!ref.current) return

    gsap.to(ref.current, {
      y: -120,
      ease: "none",
      scrollTrigger: {
        trigger: ref.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    })
  }, [])

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-screen items-center overflow-hidden pt-28"
    >
      <video
        src="/videos/hero-loop.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#050b1c]/80 via-[#070506]/60 to-[#03040a]/85" />

      <div className="section-shell relative z-20 mx-auto max-w-6xl py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <p className="section-kicker text-neon">DROP 07 — LIVE NOW</p>
            <div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Minimal design collides with unapologetic chaos.
              </h1>
              <p className="mt-4 text-lg text-slate-200">
                Limited runs inspired by the Andes, glitch art, and after-hours conversations. Each tee is finished in
                Madrid and ships worldwide in recyclable packaging.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-neon px-6 py-3 text-sm font-semibold text-black shadow-[0_10px_35px_rgba(149,255,38,0.35)] transition hover:-translate-y-0.5"
              >
                Shop the drop
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-neon hover:text-neon"
              >
                See featured tees
              </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="card-outline rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-neon">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 text-white">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">This week&apos;s moodboard</p>
            <h2 className="mt-3 text-2xl font-semibold">Chaos Bloom capsule</h2>
            <p className="mt-2 text-sm text-slate-300">
              A love letter to Andean textiles remixed with cyberpunk gradients. Each tee features a two-pass neon puff
              print for a tactile glow.
            </p>
            <div className="mt-6 space-y-3">
              {HERO_FEATURES.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Fulfillment</p>
              <p className="mt-2 text-base font-semibold text-neon">Madrid → Worldwide</p>
              <p className="text-sm text-slate-400">Carbon-neutral shipping. Free for orders over €120.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
