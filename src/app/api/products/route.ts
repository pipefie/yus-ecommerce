// app/api/products/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/utils/dbConnect'
import ProductModel from "@/models/Product"
import { fetchPrintfulProducts, mapToLocal } from "@/utils/printful"

export async function GET() {
  await dbConnect()

  // 1) Sync every Printful item into Mongo
  const pf = await fetchPrintfulProducts()
  const raws = await ProductModel.find().sort({ updatedAt: -1 }).lean()
  const products = raws.map((p) => {
    const v = p.variants[0]!
    return {
      _id:       p._id.toString(),
      title:     p.title,
      description: p.description,
      price:     v.price,
      imageUrl:  v.previewUrl ?? v.imageUrl ?? p.images[0] ?? "",
      nsfw:      p.nsfw ?? false,
    }
  })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const data = await req.json()
  await dbConnect()
  const prod = await ProductModel.create(data)
  return NextResponse.json(prod, { status: 201 })
}
