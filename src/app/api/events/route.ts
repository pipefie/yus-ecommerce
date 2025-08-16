import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertCsrf } from '@/utils/csrf'

export const runtime = 'nodejs'

const WINDOW_MS = 60 * 1000
const MAX_EVENTS = 60
const buckets = new Map<string, { count: number; reset: number }>()

function allowed(key: string) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  if (bucket.count >= MAX_EVENTS) return false
  bucket.count++
  return true
}

export async function POST(req: NextRequest) {
  const csrfError = assertCsrf(req)
  if (csrfError) return csrfError

  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!allowed(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  interface IncomingEvent {
    userId?: number
    sessionId: string
    event: string
    entityType: string
    entityId?: string
    metadata?: unknown
    ts?: string
  }

  const events = (payload as { events?: IncomingEvent[] }).events
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'No events provided' }, { status: 400 })
  }

  await prisma.userEvent.createMany({
    data: events.map((e) => ({
      userId: e.userId ?? null,
      sessionId: e.sessionId,
      event: e.event,
      entityType: e.entityType,
      entityId: e.entityId ?? null,
      metadata: e.metadata ?? {},
      ts: e.ts ? new Date(e.ts) : new Date(),
    })),
  })

  return NextResponse.json({ success: true })
}