export const CONSENT_COOKIE = "marketing_consent"
export const SESSION_COOKIE = "session"
export const UTM_SOURCE_COOKIE = "utm_source"
export const UTM_MEDIUM_COOKIE = "utm_medium"
export const UTM_CAMPAIGN_COOKIE = "utm_campaign"

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookies = document.cookie ? document.cookie.split(';') : []
  for (const raw of cookies) {
    const [k, ...rest] = raw.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

function setCookie(name: string, value: string, opts?: { maxAge?: number; path?: string }) {
  if (typeof document === 'undefined') return
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${opts?.path ?? '/'}`,
  ]
  if (opts?.maxAge) parts.push(`Max-Age=${opts.maxAge}`)
  document.cookie = parts.join('; ')
}

export function getConsentCookie() {
  return getCookie(CONSENT_COOKIE)
}

export function setConsentCookie(value: string) {
  setCookie(CONSENT_COOKIE, value, { maxAge: 60 * 60 * 24 * 365, path: '/' })
}

export function getSessionCookie() {
  return getCookie(SESSION_COOKIE)
}

export function setSessionCookie(value: string) {
  setCookie(SESSION_COOKIE, value, { path: '/' })
}

export function getUtmCookies() {
  return {
    source: getCookie(UTM_SOURCE_COOKIE),
    medium: getCookie(UTM_MEDIUM_COOKIE),
    campaign: getCookie(UTM_CAMPAIGN_COOKIE),
  }
}

export function setUtmCookies(values: { source?: string; medium?: string; campaign?: string }) {
  const maxAge = 60 * 60 * 24 * 30
  if (values.source) setCookie(UTM_SOURCE_COOKIE, values.source, { maxAge, path: '/' })
  if (values.medium) setCookie(UTM_MEDIUM_COOKIE, values.medium, { maxAge, path: '/' })
  if (values.campaign) setCookie(UTM_CAMPAIGN_COOKIE, values.campaign, { maxAge, path: '/' })
}
