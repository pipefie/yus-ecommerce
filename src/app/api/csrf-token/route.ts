import { NextResponse } from 'next/server'
import crypto from "crypto";

export async function GET() {
  const token = crypto.randomBytes(32).toString('hex')
  const res = NextResponse.json({ token })
  res.headers.set(
    'Set-Cookie',
    `csrfToken=${token}; HttpOnly; Secure; SameSite=Lax; Path=/`
  )
  return res
}