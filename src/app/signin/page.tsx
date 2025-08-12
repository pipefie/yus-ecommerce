import Image from "next/image";
import Link from "next/link";

export default function SignIn() {
  const returnTo = "/"; // adjust if you want to come back to a specific page

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-black/70 backdrop-blur p-8 shadow-neon border border-white/10">
        <div className="flex items-center justify-center mb-6">
          <Image src="/logoWhite.png" alt="Y_US? Logo" width={72} height={72} priority />
        </div>
        <h1 className="text-3xl font-pixel text-center mb-2">Welcome</h1>
        <p className="text-center text-white/70 mb-8">Nothing’s Off-Limits.</p>

        <div className="space-y-3">
          <a
            href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="block w-full text-center rounded-xl py-3 bg-neon/90 hover:bg-neon transition font-pixel"
          >
            Sign in
          </a>
          <a
            href={`/auth/login?screen_hint=signup&returnTo=${encodeURIComponent(returnTo)}`}
            className="block w-full text-center rounded-xl py-3 bg-white/10 hover:bg-white/20 transition font-pixel"
          >
            Create account
          </a>
          <Link
            href="/products"
            className="block w-full text-center rounded-xl py-3 bg-transparent border border-white/20 hover:bg-white/5 transition font-pixel"
          >
            Continue as guest
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          You’ll be redirected to our secure Auth0 Universal Login.
        </p>
      </div>
    </main>
  );
}
