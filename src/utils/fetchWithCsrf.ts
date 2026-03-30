async function getCsrfToken(): Promise<string | undefined> {
  try {
    const res = await fetch('/api/csrf-token', { credentials: 'include' })
    if (!res.ok) return undefined
    const data = (await res.json()) as { token?: string }
    return data.token
  } catch {
    return undefined
  }
}

export default async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers || {})
  const token = await getCsrfToken()
  if (token) headers.set('x-csrf-token', token)
  return fetch(input, { ...init, headers })
}