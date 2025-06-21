import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  res.headers.set('Content-Security-Policy', "default-src 'self'")
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  if (!req.cookies.get('csrfToken')) {
    const token = crypto.randomBytes(32).toString('hex')
    res.cookies.set('csrfToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
  }

  return res
}

export const config = {
  matcher: '/:path*',
}