import { parseCookies, setCookie } from "nookies"

type ParseCtx = Parameters<typeof parseCookies>[0]
type SetCtx = Parameters<typeof setCookie>[0]

export const CONSENT_COOKIE = "marketing_consent"
export const SESSION_COOKIE = "session"
export const UTM_SOURCE_COOKIE = "utm_source"
export const UTM_MEDIUM_COOKIE = "utm_medium"
export const UTM_CAMPAIGN_COOKIE = "utm_campaign"

export function getConsentCookie(ctx?: ParseCtx) {
  return parseCookies(ctx)[CONSENT_COOKIE]
}

export function setConsentCookie(value: string, ctx?: SetCtx) {
  setCookie(ctx, CONSENT_COOKIE, value, { maxAge: 60 * 60 * 24 * 365, path: "/" })
}

export function getSessionCookie(ctx?: ParseCtx) {
  return parseCookies(ctx)[SESSION_COOKIE]
}

export function setSessionCookie(value: string, ctx?: SetCtx) {
  setCookie(ctx, SESSION_COOKIE, value, { path: "/" })
}

export function getUtmCookies(ctx?: ParseCtx) {
  const cookies = parseCookies(ctx)
  return {
    source: cookies[UTM_SOURCE_COOKIE],
    medium: cookies[UTM_MEDIUM_COOKIE],
    campaign: cookies[UTM_CAMPAIGN_COOKIE],
  }
}

export function setUtmCookies(
  values: { source?: string; medium?: string; campaign?: string },
  ctx?: SetCtx
) {
  const maxAge = 60 * 60 * 24 * 30
  if (values.source)
    setCookie(ctx, UTM_SOURCE_COOKIE, values.source, { maxAge, path: "/" })
  if (values.medium)
    setCookie(ctx, UTM_MEDIUM_COOKIE, values.medium, { maxAge, path: "/" })
  if (values.campaign)
    setCookie(ctx, UTM_CAMPAIGN_COOKIE, values.campaign, { maxAge, path: "/" })
}