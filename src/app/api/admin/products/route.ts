import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const products = await prisma.product.findMany({ include: { variants: true } })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const product = await prisma.product.create({ data })
  return NextResponse.json(product)
}