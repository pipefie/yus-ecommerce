// src/app/feed/page.tsx
"use client"

import { motion } from "framer-motion"

const dummyPosts = [
  "When life gives you lemons… ask for tequila. 🍋🥃",
  "I put the ‘pro’ in procrastination.",
  "If you’re not living on the edge, you’re taking up too much space."
]

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-16 py-16 px-4">
      <h1 className="font-pixel text-4xl text-neon text-center mb-12">
        Shitpost Feed
      </h1>
      <div className="space-y-8 max-w-2xl mx-auto">
        {dummyPosts.map((content, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            className="p-6 bg-gray-900 rounded-xl shadow-neon"
          >
            <p className="font-pixel text-lg">{content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
