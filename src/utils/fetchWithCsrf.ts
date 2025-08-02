import getCsrfHeader from './getCsrfHeader'

export default async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers || {})
  const csrfHeader = (await getCsrfHeader()) as { 'x-csrf-token'?: string }
  if (csrfHeader['x-csrf-token']) headers.set('x-csrf-token', csrfHeader['x-csrf-token'])
  return fetch(input, { ...init, headers })
}