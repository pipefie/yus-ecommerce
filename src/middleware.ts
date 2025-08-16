import { NextRequest, NextResponse } from 'next/server';
import auth0 from '@/lib/auth0';

const AUTH0_ROLE_CLAIM = 'https://y-us.com/roles';
const UTM_PARAMS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
const isProd = process.env.NODE_ENV === 'production';

export async function middleware(req: NextRequest) {
  // Generate or reuse a requestId so logs can be correlated
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  req.headers.set('x-request-id', requestId);
  // 1) Always run the SDK middleware so /auth/* handlers are mounted
  const sdkRes = await auth0.middleware(req);

  // 2) Let Auth0 own /auth/* routes entirely
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    const authRes = sdkRes instanceof NextResponse ? sdkRes : NextResponse.next();
    authRes.headers.set('x-request-id', requestId);
    return authRes;
  }

  // 3) For the rest, start from the SDK response (or next())
  const res = sdkRes instanceof NextResponse ? sdkRes : NextResponse.next();
  res.headers.set('x-request-id', requestId);

  // 4) RBAC for /admin (only when needed)
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const session = await auth0.getSession(); // no req arg in v4
    const roles = (session?.user?.[AUTH0_ROLE_CLAIM] as string[] | undefined) ?? [];
    if (!roles.includes('admin')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 5) Security headers
  // Send strong CSP ONLY in production; dev needs inline/eval for HMR
  if (isProd) {
    const connectSrc = ["'self'", 'https://api.printful.com', 'https://api.stripe.com'];
    if (process.env.AUTH0_DOMAIN) {
      connectSrc.push(`https://${process.env.AUTH0_DOMAIN}`);
    }
    res.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",                                  // no inline/eval in prod
        "style-src 'self'",
        "img-src 'self' https://files.cdn.printful.com https://img.printful.com data:",
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

  // 6) CSRF seed
  if (!req.cookies.get('csrfToken')) {
    res.cookies.set('csrfToken', crypto.randomUUID(), {
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }

  // 7) UTM cookies
  for (const p of UTM_PARAMS) {
    const v = req.nextUrl.searchParams.get(p);
    if (v && !req.cookies.get(p)) {
      res.cookies.set(p, v, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        secure: isProd,
        sameSite: 'lax',
      });
    }
  }

  return res;
}

// Include /auth/*, exclude next asset files and any file with an extension
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.).*)'],
};
