import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/server/auth/isAdmin'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, context: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const params = await context.params
  const data = await req.json()
  const product = await prisma.product.update({ where: { id: Number(params.id) }, data })
  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const params = await context.params
  await prisma.product.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}