import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <p className="font-pixel text-[#39ff14] text-5xl md:text-7xl mb-6 tracking-widest">
        404
      </p>
      <h1 className="text-white text-3xl md:text-5xl font-semibold mb-4">
        you got lost.
      </h1>
      <p className="text-white/50 text-sm md:text-base max-w-sm mb-10 leading-relaxed">
        this page doesn&apos;t exist. neither does work-life balance. keep moving.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-[#39ff14] text-black font-bold text-sm tracking-widest uppercase rounded-full hover:opacity-90 transition"
      >
        back to the drop
      </Link>
    </main>
  )
}
