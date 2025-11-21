// src/app/contact/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Section } from "@/components/ui/layout";
import { Eyebrow, PageTitle, SectionTitle, BodyText } from "@/components/ui/typography";

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
    <Section as="main" padding="wide" className="min-h-screen bg-surface-soft text-foreground">
      <div className="text-center">
        <Eyebrow align="center">Contact</Eyebrow>
        <PageTitle align="center">Need help, collab, or cosmic guidance?</PageTitle>
        <BodyText tone="muted" className="mt-3 text-center">
          Slide into our inbox for support, partnerships, or press. We reply faster than your espresso shot settles.
        </BodyText>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-3xl border border-subtle bg-surface-soft/90 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-neon">Say hola</p>
          <SectionTitle align="left" className="mt-3">The humans behind the screens</SectionTitle>
          <BodyText tone="muted" className="mt-4">
            Designers, dreamers, support nerds—we’re all here reading your words. Drop us the vibe: technical issues,
            wholesale drops, or meme collabs. You’ll get a thoughtful reply from a real person.
          </BodyText>
          <div className="mt-8 grid gap-4">
            {contactHighlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-subtle bg-card/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">{item.label}</p>
                <p className="text-lg font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Channels</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="mailto:hi@y-us.shop"
                className="rounded-full border border-subtle px-4 py-2 text-foreground transition hover:border-neon hover:text-neon"
              >
                hi@y-us.shop
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                className="rounded-full border border-subtle px-4 py-2 text-foreground transition hover:border-neon hover:text-neon"
              >
                Instagram DM
              </Link>
              <Link
                href="https://t.me"
                target="_blank"
                className="rounded-full border border-subtle px-4 py-2 text-foreground transition hover:border-neon hover:text-neon"
              >
                Telegram
              </Link>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-subtle bg-surface-soft/80 p-8 shadow-soft"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <label className="text-sm text-muted">
              Full name
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-subtle bg-surface px-4 py-3 text-foreground focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/70"
              />
            </label>
            <label className="text-sm text-muted">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-subtle bg-surface px-4 py-3 text-foreground focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/70"
              />
            </label>
          </div>
          <label className="mt-6 block text-sm text-muted">
            What brings you here?
            <select
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-subtle bg-surface px-4 py-3 text-foreground focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/70"
            >
              <option value="order">Order support</option>
              <option value="collab">Collaboration</option>
              <option value="press">Press / media</option>
              <option value="other">Something else</option>
            </select>
          </label>
          <label className="mt-6 block text-sm text-muted">
            Message
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-subtle bg-surface px-4 py-3 text-foreground focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/70"
              placeholder="Give us the context. Links, order numbers, memes—all welcome."
            />
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-6 w-full rounded-2xl bg-neon py-4 text-base font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : status === "sent" ? "Message sent!" : "Send message"}
          </button>
        </form>
      </div>
    </Section>
  );
}
