"use client"

import { ReactNode } from "react"
import { CurrencyProvider } from "@/context/CurrencyContext"
import { LanguageProvider } from "@/context/LanguageContext"

export default function Providers({ children }: { children: ReactNode }) {
  return (
      <CurrencyProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </CurrencyProvider>
  )
}
