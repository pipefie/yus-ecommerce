import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const orders = await prisma.order.findMany({ include: { user: true } })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const order = await prisma.order.create({ data })
  return NextResponse.json(order)
}