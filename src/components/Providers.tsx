"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { CurrencyProvider } from "@/context/CurrencyContext"
import { LanguageProvider } from "@/context/LanguageContext"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </CurrencyProvider>
    </SessionProvider>
  )
}
