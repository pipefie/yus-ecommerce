import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return new NextResponse(null, { status: 204 })
    return NextResponse.json({ user })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}
