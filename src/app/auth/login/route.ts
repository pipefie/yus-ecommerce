import { NextRequest, NextResponse } from 'next/server'

export function GET(req: NextRequest) {
  const url = new URL(req.url)
  const qs = url.search ? url.search : ''
  return NextResponse.redirect(new URL(`/api/auth/login${qs}`, url.origin))
}

