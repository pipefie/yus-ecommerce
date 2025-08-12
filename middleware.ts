// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import auth0 from "@/lib/auth0";

const AUTH0_ROLE_CLAIM = "https://y-us.com/roles";
const UTM_PARAMS = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];

export async function middleware(req: NextRequest) {
  // 1) Always invoke the SDK middleware – this mounts /auth/* handlers
  const res = await auth0.middleware(req);

  const { pathname, searchParams } = req.nextUrl;

  // 2) If this is an /auth/* request, let the SDK response go out as-is
  if (pathname.startsWith("/auth/")) return res;

  // 3) RBAC (read session with no args)
  if (pathname.startsWith("/admin")) {
    const session = await auth0.getSession();
    const roles = (session?.user?.[AUTH0_ROLE_CLAIM] as string[] | undefined) ?? [];
    if (!roles.includes("admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 4) Security headers
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src https://images.printify.com https://images-api.printify.com 'self'"
  );
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // 5) CSRF seed
  if (!req.cookies.get("csrfToken")) {
    res.cookies.set("csrfToken", crypto.randomUUID(), {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  // 6) UTM cookies
  for (const p of UTM_PARAMS) {
    const v = searchParams.get(p);
    if (v && !req.cookies.get(p)) {
      res.cookies.set(p, v, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }
  }

  return res;
}

// Include /auth/* (don’t exclude it)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.).*)",
  ],
};
