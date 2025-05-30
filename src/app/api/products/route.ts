// app/api/products/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/utils/dbConnect'
import ProductModel from "@/models/Product"
import { fetchPrintfulProducts, mapToLocal } from "@/utils/printful"

export async function GET() {
  await dbConnect()

  try {
    const raw = await fetchPrintfulProducts();
    const all = raw.map(mapToLocal);

    const payload = all.map((p) => ({
      _id:       p.slug,
      title:    p.title,
      description: p.description,
      price:    p.price,
      imageUrl: p.imageUrl,
      nsfw:     p.nsfw,
    }));

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const data = await req.json()
  await dbConnect()
  const prod = await ProductModel.create(data)
  return NextResponse.json(prod, { status: 201 })
}
