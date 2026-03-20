import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { isAdmin } from '@/server/auth/isAdmin'
import { z } from 'zod'

const ProductCreateSchema = z.object({
  printfulProductId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().default(''),
  images: z.unknown().default([]),
})

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const products = await prisma.product.findMany({ include: { variants: true } })
  return NextResponse.json(products)
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
  const parsed = ProductCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 })
  }
  const { images, ...rest } = parsed.data
  const product = await prisma.product.create({
    data: { ...rest, images: images as Prisma.InputJsonValue },
  })
  return NextResponse.json(product)
}
