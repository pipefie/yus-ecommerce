export default function fetchWithCsrf(input: RequestInfo | URL, init: RequestInit = {}) {
  const match = typeof document !== 'undefined'
    ? document.cookie.match(/(?:^|; )csrfToken=([^;]+)/)
    : null
  const token = match ? decodeURIComponent(match[1]) : ''
  const headers = new Headers(init.headers || {})
  if (token) headers.set('x-csrf-token', token)
  return fetch(input, { ...init, headers })
}
