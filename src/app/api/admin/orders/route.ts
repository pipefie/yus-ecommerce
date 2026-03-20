import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { isAdmin } from '@/server/auth/isAdmin'
import { z } from 'zod'

const OrderCreateSchema = z.object({
  userId: z.number().int().positive().optional(),
  stripeSessionId: z.string().min(1),
  items: z.unknown(),
  totalAmount: z.number().int().nonnegative(),
  currency: z.string().length(3).default('eur'),
  status: z.enum(['pending', 'paid', 'fulfilled', 'refunded']).default('pending'),
  trackingNumber: z.string().optional(),
})

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const orders = await prisma.order.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = OrderCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 })
  }
  const { userId, items, ...rest } = parsed.data
  const order = await prisma.order.create({
    data: {
      ...rest,
      items: (items ?? []) as Prisma.InputJsonValue,
      ...(userId !== undefined ? { user: { connect: { id: userId } } } : {}),
    },
  })
  return NextResponse.json(order)
}
