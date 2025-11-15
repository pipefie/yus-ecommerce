// src/components/Footer.tsx
import Link from "next/link"

const SOCIALS = [
  { href: "https://instagram.com/yourbrand", label: "Instagram" },
  { href: "https://tiktok.com/@yourbrand", label: "TikTok" },
  { href: "https://twitter.com/yourbrand", label: "Twitter" },
]

const NAV_LINKS = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/products" },
      { label: "Feed", href: "/feed" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Cookies", href: "/cookie-policy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refund-policy" },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-24 border-t border-white/5 bg-[#050913]/95 text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon to-transparent opacity-70" />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="section-kicker text-neon">Y-US? Collective</p>
            <h3 className="mt-3 text-3xl font-semibold">Minimal design meets unfiltered chaos.</h3>
            <p className="mt-3 text-sm text-slate-400">
              Designed between Madrid and Lima, printed in limited runs, shipped worldwide. We drop new capsules monthly
              and retire them forever once they sell out.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs uppercase tracking-[0.4em] text-slate-500">
              <span className="rounded-full border border-white/10 px-4 py-2">Carbon neutral</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Worldwide shipping</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-300">
              {SOCIALS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/10 px-4 py-2 transition hover:border-neon hover:text-neon"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {NAV_LINKS.map((group) => (
              <div key={group.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{group.title}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="transition hover:text-neon"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="sm:col-span-2 rounded-3xl border border-neon/40 bg-neon/10 p-6">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-900">Stay updated</p>
              <h4 className="mt-2 text-lg font-semibold text-black">Drop alerts + early access.</h4>
              <form className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  className="flex-1 rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm text-black placeholder:text-black/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-neon transition hover:bg-gray-900"
                >
                  Join the list
                </button>
              </form>
              <p className="mt-3 text-xs text-black/70">No spam. Just drops and community events.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Y-US? · Nothing’s off-limits.</p>
          <p>Designed between Madrid & Lima · Crafted for the Internet.</p>
        </div>
      </div>
    </footer>
  )
}
