// src/components/NSFWBlock.tsx
"use client"

import { useState } from "react"

export default function NSFWBlock({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false)

  if (allowed) return <>{children}</>

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg text-center space-y-4">
      <p className="font-pixel text-lg">⚠️ NSFW Content Ahead ⚠️</p>
      <button
        onClick={() => setAllowed(true)}
        className="px-6 py-3 bg-neon text-black font-pixel rounded hover:bg-neon/80 transition"
      >
        I’m 18+ and ready to get weird
      </button>
    </div>
  )
}
