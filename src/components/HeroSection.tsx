"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import ScrollTrigger from "gsap/dist/ScrollTrigger"
import AnimatedShapes from "@/components/AnimatedShapes"

export default function HeroSection({ videoUrl }: { videoUrl?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    if (ref.current) {
      gsap.to(ref.current, {
        y: -150,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      })
    }
  }, [])

  return (
    <section
      ref={ref}
      className="h-screen relative overflow-hidden flex items-center justify-center bg-black"
    >
      {/* Full-screen autoplay video */}
      <video
        src={videoUrl || "/videos/hero-loop.mp4"}
        autoPlay
        muted
        loop
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Neon rotating ring (Quechua-style) */}
      {/*
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <svg
          className="w-32 h-32 animate-spin-slow"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
            strokeDasharray="62.8 62.8"
            className="stroke-neon/50"
          />
        </svg>
      </div> */}

      <AnimatedShapes />

      {/* Centered content stack */}
      <div className="relative z-20 flex flex-col items-center gap-4 text-center">
        <h1 className="font-pixel text-6xl text-neon animate-[glitch_2s_infinite]">
          Y-US?
        </h1>
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          internet absurdity. wearable form.
        </p>
        <a
          href="#products"
          className="mt-2 inline-block px-6 py-3 border-2 border-neon text-neon font-bold font-pixel rounded hover:bg-neon hover:text-black transition"
        >
          Shop Now
        </a>
      </div>
    </section>
  )
}
