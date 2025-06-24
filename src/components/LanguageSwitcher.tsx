"use client"

import { useLanguage } from "../context/LanguageContext"
import { useRouter } from "next/navigation"

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  return (
    <select
      className="bg-black text-white border border-neon rounded px-2 py-1"
      value={language}
      onChange={(e) => {
        setLanguage(e.target.value)
        router.refresh()
      }}
      aria-label="Select language"
    >
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="fr">FR</option>
        <option value="de">DE</option>
    </select>
  )
}