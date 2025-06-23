import { NextRequest, NextResponse } from 'next/server'
import { assertCsrf } from '@/utils/csrf'
import { sendWelcomeEmail } from '@/utils/sendgrid'

export async function POST(req: NextRequest) {
  const csrfError = assertCsrf(req)
  if (csrfError) return csrfError

  const { email, name } = await req.json()
  try {
    await sendWelcomeEmail(email, name)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Email failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}