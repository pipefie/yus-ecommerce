// src/components/AnimatedShapes.tsx
"use client"

import { motion } from "framer-motion"

const SHAPES = [
  { size: 80, top: 10, left: 15, delay: 0 },
  { size: 120, top: 30, left: 70, delay: 2 },
  { size: 60, top: 70, left: 40, delay: 1 },
]

export default function AnimatedShapes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {SHAPES.map(({ size, top, left, delay }, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-neon/20"
          style={{ width: size, height: size, top: `${top}%`, left: `${left}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.6, 0.2, 0.6] }}
          transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
