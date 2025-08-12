import Image from "next/image";
import Link from "next/link";

export default function SignUp() {
  const returnTo = "/";

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-black/70 backdrop-blur p-8 shadow-neon border border-white/10">
        <div className="flex items-center justify-center mb-6">
          <Image src="/logoWhite.png" alt="Y_US? Logo" width={72} height={72} priority />
        </div>
        <h1 className="text-3xl font-pixel text-center mb-2">Create your account</h1>
        <p className="text-center text-white/70 mb-8">Join the Y-US? community.</p>

        <div className="space-y-3">
          <a
            href={`/auth/login?screen_hint=signup&returnTo=${encodeURIComponent(returnTo)}`}
            className="block w-full text-center rounded-xl py-3 bg-neon/90 hover:bg-neon transition font-pixel"
          >
            Continue with Auth0
          </a>
          <Link
            href="/signin"
            className="block w-full text-center rounded-xl py-3 bg-transparent border border-white/20 hover:bg-white/5 transition font-pixel"
          >
            I already have an account
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          You’ll be redirected to our secure Auth0 Universal Login.
        </p>
      </div>
    </main>
  );
}
