import { NextResponse } from 'next/server'
import auth0 from '@/lib/auth0'

export async function GET() {
  try {
    const session = await auth0.getSession()
    if (!session) return new NextResponse(null, { status: 204 })
    // Return minimal shape { user }
    return NextResponse.json({ user: session.user ?? null })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}

