import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { buildAuthorizationUrl, generateCodeVerifier, generateNonce, generateState } from "@/lib/auth/oidc";
import { env } from "@/lib/env";
import { sessionSecret } from "@/lib/auth/session";
import { PKCE_COOKIE_NAME } from "@/lib/auth/constants";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const returnTo = url.searchParams.get("returnTo") ?? "/";
  const promptParam = url.searchParams.get("prompt") ?? undefined;
  const allowlistedPrompt =
    promptParam && (promptParam === "login" || promptParam === "consent")
      ? promptParam
      : undefined;

  const { verifier, challenge } = await generateCodeVerifier();
  const state = await generateState();
  const nonce = await generateNonce();

  const authorizationUrl = await buildAuthorizationUrl({
    codeChallenge: challenge,
    nonce,
    state,
    prompt: allowlistedPrompt,
  });

  const pkceToken = await new SignJWT({
    verifier,
    nonce,
    state,
    returnTo,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(sessionSecret);

  const res = NextResponse.redirect(authorizationUrl, 302);
  res.cookies.set({
    name: PKCE_COOKIE_NAME,
    value: pkceToken,
    httpOnly: true,
    secure: env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}


