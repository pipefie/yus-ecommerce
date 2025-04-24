"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Manual credentials sign-in
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/",
    })
    if (res?.error) setError(res.error)
    else router.push(res?.url || "/")
  }

  return (
    <div className="pt-16 min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-neon space-y-6">
        <h2 className="font-pixel text-3xl text-neon text-center">Sign In</h2>

        {/* Manual Form */}
        <form onSubmit={handleCredentials} className="space-y-4">
          {error && (
            <p className="text-red-500 text-sm font-pixel">{error}</p>
          )}
          <label className="block">
            <span className="font-pixel text-gray-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-3 bg-black text-white rounded outline-neon focus:outline"
            />
          </label>
          <label className="block">
            <span className="font-pixel text-gray-300">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 bg-black text-white rounded outline-neon focus:outline"
            />
          </label>
          <button
            type="submit"
            className="w-full py-3 bg-neon text-black rounded font-pixel hover:bg-neon/80 transition"
          >
            Sign In
          </button>
        </form>

        {/* OAuth Buttons */}
        <div className="border-t border-gray-700 pt-4 space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full py-3 bg-white text-black rounded font-pixel hover:opacity-80"
          >
            Continue with Google
          </button>
          <button
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
            className="w-full py-3 bg-blue-600 text-white rounded font-pixel hover:opacity-80"
          >
            Continue with Facebook
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Don’t have an account?{" "}
          <a
            href="/auth/signup"
            className="underline hover:text-neon font-pixel"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  )
}
