import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src https://images.printify.com https://images-api.printify.com 'self'"
  )
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  if (!req.cookies.get('csrfToken')) {
    const token = crypto.randomUUID()
    res.cookies.set('csrfToken', token, {
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