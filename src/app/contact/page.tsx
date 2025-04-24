// src/app/contact/page.tsx
"use client"

import { useState } from "react"

export default function ContactPage() {
  const [status, setStatus] = useState<"idle"|"sending"|"sent">("idle")
  const [form, setForm] = useState({ name: "", email: "", message: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("sending")
    // TODO: wire this up to your own email API or service
    await new Promise((r) => setTimeout(r, 1000))
    setStatus("sent")
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-gray-900 p-8 rounded-2xl shadow-neon"
      >
        <h2 className="font-pixel text-3xl text-neon mb-6">Get In Touch</h2>
        {/* Name */}
        <label className="block mb-4">
          <span className="font-pixel text-gray-300">Name</span>
          <input
            type="text" required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-2 w-full p-3 bg-black text-white rounded outline-neon focus:outline"
          />
        </label>
        {/* Email */}
        <label className="block mb-4">
          <span className="font-pixel text-gray-300">Email</span>
          <input
            type="email" required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-2 w-full p-3 bg-black text-white rounded outline-neon focus:outline"
          />
        </label>
        {/* Message */}
        <label className="block mb-6">
          <span className="font-pixel text-gray-300">Message</span>
          <textarea
            rows={5} required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="mt-2 w-full p-3 bg-black text-white rounded outline-neon focus:outline resize-none"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full py-3 font-pixel text-lg bg-neon text-black rounded hover:bg-neon/80"
        >
          {status === "sending" ? "Sending..." : status === "sent" ? "Sent!" : "Send Message"}
        </button>
      </form>
    </div>
  )
}
