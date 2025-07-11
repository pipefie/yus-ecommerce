"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import getCsrfHeader from "@/utils/getCsrfHeader"

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    newsletterOptIn: false,
  })
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getCsrfHeader() },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setError(data.error || "Something went wrong")
      return
    }
    // After signup, redirect to credentials sign-in
    router.push(data.url)
  }

  return (
    <div className="pt-16 min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-neon space-y-6">
        <h2 className="font-pixel text-3xl text-neon text-center">Sign Up</h2>

        {/* Manual Sign-Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-500 text-sm font-pixel">{error}</p>
          )}
          <label className="block">
            <span className="font-pixel text-gray-300">Name</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="mt-1 w-full p-3 bg-black text-white rounded outline-neon focus:outline"
            />
          </label>
          <label className="block">
            <span className="font-pixel text-gray-300">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="mt-1 w-full p-3 bg-black text-white rounded outline-neon focus:outline"
            />
          </label>
          <label className="block">
            <span className="font-pixel text-gray-300">Password</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="mt-1 w-full p-3 bg-black text-white rounded outline-neon focus:outline"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.newsletterOptIn}
              onChange={(e) =>
                setForm({ ...form, newsletterOptIn: e.target.checked })
              }
              className="h-4 w-4 rounded"
            />
            <span className="font-pixel text-sm text-gray-300">
              Sign me up for the newsletter
            </span>
          </label>
          <button
            type="submit"
            className="w-full py-3 bg-neon text-black rounded font-pixel hover:bg-neon/80 transition"
          >
            Create Account
          </button>
        </form>

        {/* OAuth Buttons */}
        <div className="border-t border-gray-700 pt-4 space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full py-3 bg-white text-black rounded font-pixel hover:opacity-80"
          >
            Sign Up with Google
          </button>
          <button
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
            className="w-full py-3 bg-blue-600 text-white rounded font-pixel hover:opacity-80"
          >
            Sign Up with Facebook
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a
            href="/auth/signin"
            className="underline hover:text-neon font-pixel"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  )
}
