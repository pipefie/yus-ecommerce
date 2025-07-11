export default function getCsrfHeader(): HeadersInit {
  const match = typeof document !== 'undefined'
    ? document.cookie.match(/(?:^|; )csrfToken=([^;]+)/)
    : null
  const token = match ? decodeURIComponent(match[1]) : ''
  return token ? { 'x-csrf-token': token } : {}
}