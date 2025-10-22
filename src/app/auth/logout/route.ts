import { NextRequest, NextResponse } from "next/server";
import { getEndSessionUrl } from "@/lib/auth/oidc";
import { buildClearedSessionCookie } from "@/lib/auth/session";
import { ID_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";

function sanitizeReturnTo(target: string | null, origin: string): string {
  if (!target) return "/";
  try {
    const url = new URL(target, origin);
    if (url.origin !== origin) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const returnTo = sanitizeReturnTo(url.searchParams.get("returnTo"), url.origin);

  const idToken = req.cookies.get(ID_TOKEN_COOKIE_NAME)?.value;
  

  const localRedirect = new URL(returnTo, url.origin).toString();
  let redirectTarget = localRedirect;
  if (idToken) {
    const endSession = await getEndSessionUrl(idToken, localRedirect).catch(() => null);
    if (endSession) {
      redirectTarget = endSession;
    }
  }

  const res = NextResponse.redirect(redirectTarget, 302);
  res.cookies.set(buildClearedSessionCookie());
  res.cookies.delete(ID_TOKEN_COOKIE_NAME);
  return res;
}


