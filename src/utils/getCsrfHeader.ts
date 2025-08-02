export default async function getCsrfHeader(): Promise<HeadersInit> {
  try {
    const res = await fetch('/api/csrf-token', {
      credentials: 'include',
    })
    if (!res.ok) return {}
    const data = (await res.json()) as { token?: string }
    return data.token ? { 'x-csrf-token': data.token } : {}
  } catch {
    return {}
  }
}