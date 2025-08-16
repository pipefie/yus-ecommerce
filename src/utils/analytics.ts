import fetchWithCsrf from './fetchWithCsrf'

interface EventPayload {
  userId?: number
  event: string
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
}

type QueuedEvent = EventPayload & { sessionId: string; ts: string }

const queue: QueuedEvent[] = []

const sessionId = (() => {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('sessionId')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('sessionId', id)
  }
  return id
})()

export function track(event: EventPayload) {
  if (typeof window === 'undefined') return
  if (localStorage.getItem('cookieConsent') !== 'true') return
  queue.push({ ...event, sessionId, ts: new Date().toISOString() })
}

export async function flush() {
  if (!queue.length) return
  const events = queue.splice(0, queue.length)
  try {
    await fetchWithCsrf('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    })
  } catch {
    // swallow errors
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}