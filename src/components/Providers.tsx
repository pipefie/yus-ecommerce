"use client"

import { UserProvider } from "@auth0/nextjs-auth0/client"
import { ReactNode } from "react"
import { CurrencyProvider } from "@/context/CurrencyContext"
import { LanguageProvider } from "@/context/LanguageContext"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <CurrencyProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </CurrencyProvider>
    </UserProvider>
  )
}
