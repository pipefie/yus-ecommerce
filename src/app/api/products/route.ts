// app/api/products/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/utils/dbConnect'
import Product from '@/models/Product'

export async function GET() {
  await dbConnect()
  const prods = await Product.find().sort({ updatedAt: -1 }).lean()
  return NextResponse.json(prods, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=3600" }
  })
}

export async function POST(req: Request) {
  const data = await req.json()
  await dbConnect()
  const prod = await Product.create(data)
  return NextResponse.json(prod, { status: 201 })
}
