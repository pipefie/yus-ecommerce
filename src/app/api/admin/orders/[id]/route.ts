import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/server/auth/isAdmin'
import { z } from 'zod'

const OrderUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'fulfilled', 'refunded']).optional(),
  trackingNumber: z.string().nullable().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, context: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const params = await context.params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = OrderUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 })
  }
  const order = await prisma.order.update({ where: { id: Number(params.id) }, data: parsed.data })
  return NextResponse.json(order)
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const params = await context.params
  await prisma.order.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
