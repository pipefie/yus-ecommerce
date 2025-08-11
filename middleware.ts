// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import auth0 from '@/lib/auth0' // or './lib/auth0' if not using baseUrl/paths

const AUTH0_ROLE_CLAIM = 'https://y-us.com/roles'
const UTM_PARAMS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']

export async function middleware(req: NextRequest) {
  let res = await auth0.middleware(req) // mounts /auth/* and returns a NextResponse

  const session = await auth0.getSession(req)

  if (!session) {
    if (req.cookies.get('appSession')) res.cookies.delete('appSession')
    if (req.cookies.get('appSession.legacy')) res.cookies.delete('appSession.legacy')
  }

  const pathname = req.nextUrl.pathname
  if (pathname.startsWith('/admin')) {
    const roles = (session?.user?.[AUTH0_ROLE_CLAIM] as string[] | undefined) ?? []
    if (!roles.includes('admin')) {
      const redirectRes = NextResponse.redirect(new URL('/', req.url))
      if (!session) {
        if (req.cookies.get('appSession')) redirectRes.cookies.delete('appSession')
        if (req.cookies.get('appSession.legacy')) redirectRes.cookies.delete('appSession.legacy')
      }
      return redirectRes
    }
  }

  // your headers + cookies exactly as you had…
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
    res.cookies.set('csrfToken', crypto.randomUUID(), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
  }

  for (const param of UTM_PARAMS) {
    const value = req.nextUrl.searchParams.get(param)
    if (value && !req.cookies.get(param)) {
      res.cookies.set(param, value, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }
  }

  return res
}

export const config = { matcher: ['/((?!api|_next|.*\\.).*)'] }
