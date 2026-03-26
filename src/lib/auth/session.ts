import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { OidcUser, SessionPayload } from "./types";

const encoder = new TextEncoder();
export const sessionSecret = encoder.encode(env.SESSION_SECRET);

const cookieName = env.SESSION_COOKIE_NAME;
const ttlSeconds = env.SESSION_TTL_HOURS * 60 * 60;

export async function createSessionToken(user: OidcUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(sessionSecret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret, { algorithms: ["HS256"] });
    const user = payload.user;
    if (!user || typeof user !== "object") {
      return null;
    }
    return {
      user: user as OidcUser,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

const baseCookieOptions = {
  name: cookieName,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV !== "development",
  path: "/",
};

export function buildSessionCookie(token: string) {
  return {
    ...baseCookieOptions,
    value: token,
    maxAge: ttlSeconds,
  } as const;
}

export function buildClearedSessionCookie() {
  return {
    ...baseCookieOptions,
    value: "",
    maxAge: 0,
  } as const;
}

export async function getSessionFromRequest(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function parseSessionFromToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  return verifySessionToken(token);
}

export const sessionCookieName = cookieName;
export const sessionTTLSeconds = ttlSeconds;

export async function getSessionUser(): Promise<OidcUser | null> {
  const payload = await getSessionFromRequest();
  return payload?.user ?? null;
}
