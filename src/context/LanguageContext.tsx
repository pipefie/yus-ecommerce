"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface LanguageContextValue {
  language: string
  setLanguage: (lang: string) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState("en")

  // Hydrate from localStorage or cookie
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("language")
    const cookieMatch = document.cookie.match(/(?:^|; )language=([^;]+)/)
    const initial = stored || (cookieMatch && decodeURIComponent(cookieMatch[1]))
    if (initial) setLang(initial)
  }, [])

  const updateLanguage = (lang: string) => {
    setLang(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang)
      document.cookie = `language=${lang}; path=/`
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be in LanguageProvider")
  return ctx
}