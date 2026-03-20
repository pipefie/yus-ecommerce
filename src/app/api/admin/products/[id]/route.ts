import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { isAdmin } from '@/server/auth/isAdmin'
import { z } from 'zod'

const ProductUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  imageUrl: z.string().optional(),
  images: z.unknown().optional(),
  deleted: z.boolean().optional(),
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
  const parsed = ProductUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 })
  }
  const { images, ...rest } = parsed.data
  const product = await prisma.product.update({
    where: { id: Number(params.id) },
    data: {
      ...rest,
      ...(images !== undefined ? { images: images as Prisma.InputJsonValue } : {}),
    },
  })
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