// src/components/Footer.tsx
import Link from "next/link"
import Image from "next/image"

const socials = [
  { href: "https://instagram.com/yourbrand", icon: "/icons/instagram.png", label: "Instagram" },
  { href: "https://tiktok.com/@yourbrand", icon: "/icons/tiktok.png", label: "TikTok" },
  { href: "https://twitter.com/yourbrand", icon: "/icons/twitter.svg", label: "Twitter" },
]

export default function Footer() {
  return (
    <footer className="bg-black px-4 py-10 text-white">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        <div>
          <h3 className="font-pixel text-2xl text-neon">Y-US?</h3>
          <p className="mt-2 text-sm text-gray-300">Graphic tees from Madrid. Worldwide shipping.</p>
          <div className="mt-4 flex gap-3">
            {socials.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 p-2 transition hover:border-neon"
                aria-label={social.label}
              >
                <Image src={social.icon} alt={social.label} width={20} height={20} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-pixel text-xl text-neon">Explore</h4>
          <ul className="mt-4 space-y-1 text-sm text-gray-300">
            <li><Link href="/" className="transition hover:text-neon">Home</Link></li>
            <li><Link href="/products" className="transition hover:text-neon">Shop</Link></li>
            <li><Link href="/feed" className="transition hover:text-neon">Feed</Link></li>
            <li><Link href="/contact" className="transition hover:text-neon">Contact</Link></li>
            <li><Link href="/privacy-policy" className="transition hover:text-neon">Privacy</Link></li>
            <li><Link href="/cookie-policy" className="transition hover:text-neon">Cookies</Link></li>
            <li><Link href="/terms" className="transition hover:text-neon">Terms</Link></li>
            <li><Link href="/refund-policy" className="transition hover:text-neon">Refunds</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-pixel text-xl text-neon">Stay Updated</h4>
          <form className="mt-4 flex flex-col gap-2">
            <input
              type="email"
              placeholder="you@email.com"
              className="w-full rounded bg-white px-3 py-2 text-sm text-black"
            />
            <button
              type="submit"
              className="rounded bg-neon px-4 py-2 font-pixel text-black transition hover:bg-neon/80"
            >
              Join List
            </button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-gray-500">© {new Date().getFullYear()} Y-US? All rights reserved.</p>
    </footer>
  )
}
