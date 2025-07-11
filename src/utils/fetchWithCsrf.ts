import getCsrfHeader from './getCsrfHeader'

export default function fetchWithCsrf(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {})
  const csrfHeader = (getCsrfHeader() as { 'x-csrf-token'?: string })['x-csrf-token']
  if (csrfHeader) headers.set('x-csrf-token', csrfHeader)
  return fetch(input, { ...init, headers })
}
