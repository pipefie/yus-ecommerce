import { NextRequest, NextResponse } from 'next/server';
import { parseSessionFromToken, sessionCookieName } from '@/lib/auth/session';
import { env } from '@/lib/env';

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const isProd = env.NODE_ENV === 'production';
const protectedPrefixes = ['/account', '/checkout', '/orders', '/admin'];

function needsAuthentication(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function sanitizeReturnTo(pathname: string, search: string): string {
  const target = `${pathname}${search}`;
  return target || '/';
}

const cdnHost = (() => {
  try {
    return new URL(env.CLOUDFRONT_BASE_URL).hostname;
  } catch {
    return '';
  }
})();

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const sessionToken = req.cookies.get(sessionCookieName)?.value;
  const session = await parseSessionFromToken(sessionToken);

  if (needsAuthentication(pathname) && !session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('returnTo', sanitizeReturnTo(pathname, nextUrl.search));
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') && session?.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const requestId = req.headers.get('x-request-id') ?? globalThis.crypto?.randomUUID?.() ?? '';
  if (requestId) {
    req.headers.set('x-request-id', requestId);
  }

  const res = NextResponse.next();
  if (requestId) {
    res.headers.set('x-request-id', requestId);
  }
  if (session) {
    res.headers.set('x-authenticated-user', session.user.sub);
  }

  if (isProd) {
    const connectSrc = ["'self'", 'https://api.stripe.com'];
    try {
      const issuer = new URL(env.OIDC_ISSUER);
      connectSrc.push(issuer.origin);
    } catch {
      // ignore invalid issuer URL
    }

    const imgSrc = ["'self'", 'data:'];
    if (cdnHost) {
      imgSrc.push(`https://${cdnHost}`);
    }

    res.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        `img-src ${imgSrc.join(' ')}`,
        "font-src 'self' data:",
        `connect-src ${connectSrc.join(' ')}`,
        "frame-ancestors 'none'",
        "base-uri 'self'",
      ].join('; ')
    );
  }

  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (!req.cookies.get('csrfToken')) {
    res.cookies.set('csrfToken', globalThis.crypto?.randomUUID?.() ?? '', {
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }

  for (const param of UTM_PARAMS) {
    const value = req.nextUrl.searchParams.get(param);
    if (value && !req.cookies.get(param)) {
      res.cookies.set(param, value, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        secure: isProd,
        sameSite: 'lax',
      });
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.).*)'],
};
