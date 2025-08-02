import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.JWT_SECRET })

  if (!token || token.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const res = NextResponse.next()

  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src https://images.printify.com https://images-api.printify.com 'self'"
  )
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  if (!req.cookies.get('csrfToken')) {
    const csrfToken = crypto.randomUUID()
    res.cookies.set('csrfToken', csrfToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
  }

  return res
}

export const config = {
  matcher: '/admin/:path*',
}