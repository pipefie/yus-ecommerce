"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"

const TEXT = ["Y", "_", "U", "S", "?"] // you can animate each char

export default function Loading() {
  const [index, setIndex] = useState(0)
  const textControls = useAnimation()

  // Type-on effect cycling through TEXT
  useEffect(() => {
    if (index < TEXT.length) {
      const timer = setTimeout(() => setIndex(index + 1), 200)
      return () => clearTimeout(timer)
    } else {
      // After full text appears, start flicker
      textControls.start({
        opacity: [1, 0.3, 1],
        transition: { duration: 1, repeat: Infinity },
      })
    }
  }, [index, textControls])

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Morphing blob behind everything */}
      <AnimatePresence>
        <motion.svg
          key="morph"
          viewBox="0 0 600 600"
          className="absolute w-[140vw] h-[140vh] opacity-20"
          initial={{ scale: 1 }}
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.path
            fill="url(#grad)"
            d="M421.6,329.6Q379.2,409.1,297.2,424.9Q215.1,440.7,142.6,396.8Q70.1,352.8,80.6,270.6Q91,188.3,165.8,134.1Q240.5,79.9,319.2,118.7Q398,157.5,425.9,242.5Q453.8,327.5,421.6,329.6Z"
            animate={{
              d: [
                // two slightly different blob shapes
                "M421.6,329.6Q379.2,409.1,297.2,424.9Q215.1,440.7,142.6,396.8Q70.1,352.8,80.6,270.6Q91,188.3,165.8,134.1Q240.5,79.9,319.2,118.7Q398,157.5,425.9,242.5Q453.8,327.5,421.6,329.6Z",
                "M430.3,339.7Q385.7,419.4,303.1,425.1Q220.5,430.8,142.4,387.9Q64.2,345.1,99.0,262.4Q133.8,179.7,186.0,118.7Q238.2,57.7,311.0,81.4Q383.8,105.0,431.2,196.5Q478.7,288.1,430.3,339.7Z"
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="grad">
              <stop offset="0%" stopColor="#39ff14" />
              <stop offset="100%" stopColor="#ff69b4" />
            </linearGradient>
          </defs>
        </motion.svg>
      </AnimatePresence>

      {/* Neon ring pulse */}
      <motion.div
        className="absolute w-40 h-40 rounded-full border-8 border-neon/30"
        animate={{ scale: [1, 1.2, 1], borderColor: ["#39ff14", "#ff69b4", "#39ff14"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Type-on & flicker text */}
      <motion.h1
        className="relative z-10 font-pixel text-6xl text-white"
        animate={textControls}
      >
        {TEXT.slice(0, index).join("")}
      </motion.h1>
    </div>
  )
}
