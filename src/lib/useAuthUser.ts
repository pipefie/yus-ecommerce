"use client"
import { useEffect, useState } from 'react'

export type AuthUser = {
  [key: string]: unknown
} | null

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!cancelled) {
          setUser((data && (data.user ?? data)) || null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return { user, isLoading }
}

