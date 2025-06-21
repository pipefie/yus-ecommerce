// src/components/Footer.tsx
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-black text-white py-8 px-4">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Brand & Tagline */}
        <div>
          <h3 className="font-pixel text-2xl text-neon mb-2">Y-US?</h3>
          <p className="text-sm">Minimal design meets unfiltered chaos.</p>
        </div>

        {/* Navigation Links */}
        <div>
          <h4 className="font-pixel text-xl text-y2k-pink mb-2">Explore</h4>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/" className="hover:text-neon">Home</Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-neon">Shop</Link>
            </li>
            <li>
              <Link href="/feed" className="hover:text-neon">Shitpost Feed</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-neon">Contact</Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-neon">Privacy</Link>
            </li>
            <li>
              <Link href="/cookie-policy" className="hover:text-neon">Cookies</Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-neon">Terms</Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-neon">Refunds</Link>
            </li>            
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h4 className="font-pixel text-xl text-neon mb-2">Stay Updated</h4>
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 p-2 rounded bg-white text-black text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-neon text-black font-pixel rounded hover:bg-neon/80 transition"
            >
              Join Cult
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Y-US? — All Rights Reserved.
      </div>
    </footer>
  )
}
