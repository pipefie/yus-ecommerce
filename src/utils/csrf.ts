import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export function assertCsrf(req: NextRequest): NextResponse | null {
  const cookieToken = req.cookies.get('csrfToken')?.value
  const headerToken = req.headers.get('x-csrf-token')
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }
  return null
}

export function generateCsrfToken(): { name: string; value: string } {
  const token = crypto.randomBytes(32).toString('hex')
  return { name: 'csrfToken', value: token }
}