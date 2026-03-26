"use client"
import { useEffect, useState } from 'react'
import type { OidcUser } from '@/lib/auth/types'

export type AuthUser = OidcUser | null

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetch('/auth/session', { cache: 'no-store' })
        if (!res.ok) return
        if (res.status === 204) {
          if (!cancelled) setUser(null)
          return
        }
        const data = await res.json().catch(() => null) as { user?: OidcUser } | null
        if (!cancelled) {
          setUser(data?.user ?? null)
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

