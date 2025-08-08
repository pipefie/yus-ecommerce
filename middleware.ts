import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const session = await getSession(req, res)
  const user = session?.user as { role?: string } | undefined

  if (!session || user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

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