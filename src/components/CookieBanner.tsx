"use client"
import { useEffect, useState } from "react"
import { getConsentCookie, setConsentCookie } from "@/utils/cookies"

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = getConsentCookie()
    if (!consent) setVisible(true)
  }, [])

  if (!visible) return null

  const accept = () => {
    setConsentCookie("true")
    setVisible(false)
  }

  const decline = () => {
    setConsentCookie("false")
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 flex flex-col sm:flex-row items-center justify-between z-50">
      <p className="mb-2 sm:mb-0">
        We use cookies for analytics. Read our{" "}
        <a href="/cookie-policy" className="underline">
          Cookie Policy
        </a>
        .
      </p>
      <div className="flex gap-2">
        <button
          onClick={decline}
          className="bg-[#555] text-white px-3 py-1 font-mono"
        >
          Decline
        </button>
        <button
          onClick={accept}
          className="bg-[#39ff14] text-black px-3 py-1 font-mono"
        >
          Accept
        </button>
      </div>
    </div>
  )
}