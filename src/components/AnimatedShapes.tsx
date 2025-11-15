// src/components/AnimatedShapes.tsx
"use client"

import { motion } from "framer-motion"

const SHAPES = [
  { size: 320, top: 8, left: 18, delay: 0, blur: 35, colors: ["rgba(149,255,38,0.35)", "rgba(149,255,38,0)"] },
  { size: 260, top: 40, left: 70, delay: 2, blur: 30, colors: ["rgba(255,102,217,0.28)", "rgba(255,102,217,0)"] },
  { size: 180, top: 65, left: 35, delay: 1, blur: 25, colors: ["rgba(41,196,255,0.3)", "rgba(41,196,255,0)"] },
]

export default function AnimatedShapes() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {SHAPES.map(({ size, top, left, delay, blur, colors }, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            top: `${top}%`,
            left: `${left}%`,
            background: `radial-gradient(circle, ${colors[0]} 0%, ${colors[1]} 70%)`,
            filter: `blur(${blur}px)`,
            mixBlendMode: "screen",
          }}
          animate={{
            y: [0, -25, 10],
            opacity: [0.6, 0.25, 0.6],
          }}
          transition={{
            duration: 14,
            delay,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
