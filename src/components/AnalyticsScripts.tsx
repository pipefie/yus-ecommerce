"use client"
import { useEffect, useState } from "react"
import Script from "next/script"

export default function AnalyticsScripts() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("cookieConsent")
      if (consent === "true") setEnabled(true)
    }
  }, [])

  if (!enabled) return null

  const id = process.env.NEXT_PUBLIC_GA_ID
  if (!id) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${id}');`}
      </Script>
    </>
  )
}