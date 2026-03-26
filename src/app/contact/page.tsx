// src/app/contact/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

const contactHighlights = [
  { label: "HQ", value: "Madrid → Worldwide" },
  { label: "Response time", value: "< 24 hours on weekdays" },
  { label: "Support hours", value: "09:00 – 19:00 CET" },
];

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [form, setForm] = useState({ name: "", email: "", topic: "order", message: "" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus("sent");
    setForm({ name: "", email: "", topic: "order", message: "" });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-20 pb-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold">Need help, collab, or cosmic guidance?</h1>
          <p className="mt-3 text-slate-400">
            Slide into our inbox for support, partnerships, or press. We reply faster than your espresso shot settles.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-8 shadow-[0_0_80px_rgba(45,212,191,0.08)]">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Say hola</p>
            <h2 className="mt-3 text-3xl font-semibold">The humans behind the screens</h2>
            <p className="mt-4 text-sm text-slate-300">
              Designers, dreamers, support nerds—we’re all here reading your words. Drop us the vibe: technical issues,
              wholesale drops, or meme collabs. You’ll get a thoughtful reply from a real person.
            </p>
            <div className="mt-8 grid gap-4">
              {contactHighlights.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-800/60 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                  <p className="text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Channels</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="mailto:hi@y-us.shop"
                  className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 transition hover:border-emerald-400"
                >
                  hi@y-us.shop
                </Link>
                <Link
                  href="https://instagram.com"
                  target="_blank"
                  className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 transition hover:border-emerald-400"
                >
                  Instagram DM
                </Link>
                <Link
                  href="https://t.me"
                  target="_blank"
                  className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 transition hover:border-emerald-400"
                >
                  Telegram
                </Link>
              </div>
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-8 shadow-[0_0_60px_rgba(15,23,42,0.5)]"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <label className="text-sm text-slate-400">
                Full name
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none"
                />
              </label>
            </div>
            <label className="mt-6 block text-sm text-slate-400">
              What brings you here?
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="order">Order support</option>
                <option value="collab">Collaboration</option>
                <option value="press">Press / media</option>
                <option value="other">Something else</option>
              </select>
            </label>
            <label className="mt-6 block text-sm text-slate-400">
              Message
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none"
                placeholder="Give us the context. Links, order numbers, memes—all welcome."
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-6 w-full rounded-2xl bg-emerald-400/90 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : status === "sent" ? "Message sent!" : "Send message"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
