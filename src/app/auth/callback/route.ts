import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { handleCallback } from "@/lib/auth/oidc";
import { sessionSecret, createSessionToken, buildSessionCookie } from "@/lib/auth/session";
import { PKCE_COOKIE_NAME, ID_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { upsertOidcUser, updateUserRole } from "@/lib/db/users";
import { isWhitelistedAdmin } from "@/lib/auth/adminWhitelist";

function validateReturnTo(input: string | undefined | null, origin: string): string {
  if (!input) return "/";
  try {
    const url = new URL(input, origin);
    if (url.origin !== origin) {
      return "/";
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const fail = (code: string) => {
    const res = NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(code)}`);
    res.cookies.delete(PKCE_COOKIE_NAME);
    return res;
  };
  if (url.searchParams.has("error")) {
    const description = url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? "login_failed";
    return fail(description);
  }

  const pkceToken = req.cookies.get(PKCE_COOKIE_NAME)?.value;
  if (!pkceToken) {
    return fail("missing_pkce");
  }

  let pkcePayload: { verifier: string; nonce: string; state: string; returnTo?: string };
  try {
    const { payload } = await jwtVerify(pkceToken, sessionSecret, { algorithms: ["HS256"] });
    pkcePayload = {
      verifier: String(payload.verifier),
      nonce: String(payload.nonce),
      state: String(payload.state),
      returnTo: payload.returnTo ? String(payload.returnTo) : undefined,
    };
  } catch {
    return fail("invalid_pkce");
  }

  const stateParam = url.searchParams.get("state");
  if (!stateParam || stateParam !== pkcePayload.state) {
    return fail("state_mismatch");
  }

  const currentUrl = new URL(url.toString());
  const tokenSet = await handleCallback({
    url: currentUrl,
    codeVerifier: pkcePayload.verifier,
    state: pkcePayload.state,
    nonce: pkcePayload.nonce,
  }).catch(() => null);

  if (!tokenSet) {
    return fail("token_exchange_failed");
  }

  const claims = tokenSet.claims();
  const sub = claims.sub;
  if (typeof sub !== "string" || !sub) {
    return fail("missing_sub");
  }

  let user = await upsertOidcUser({
    sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    name: typeof claims.name === "string" ? claims.name : undefined,
    picture: typeof claims.picture === "string" ? claims.picture : undefined,
  });

  const forceAdmin = isWhitelistedAdmin(user.email);

  if (user.role !== "admin") {
    const otherAdmin = await prisma.user.findFirst({
      where: { role: "admin", sub: { not: user.sub } },
      select: { sub: true },
    });
    if (forceAdmin || !otherAdmin) {
      const promoted = await updateUserRole(user.sub, "admin");
      if (promoted) {
        user = promoted;
      }
    }
  }

  const res = NextResponse.redirect(
    new URL(validateReturnTo(pkcePayload.returnTo, url.origin), url.origin),
    302,
  );

  const sessionToken = await createSessionToken(user);
  res.cookies.set(buildSessionCookie(sessionToken));
  res.cookies.delete(PKCE_COOKIE_NAME);
  if (tokenSet.id_token) {
    res.cookies.set({
      name: ID_TOKEN_COOKIE_NAME,
      value: tokenSet.id_token,
      httpOnly: true,
      secure: env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
  }
  return res;
}
