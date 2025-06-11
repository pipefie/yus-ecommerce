// app/api/products/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/utils/dbConnect'
import ProductModel from "@/models/Product"
import { fetchPrintifyProducts, mapToLocal } from "@/utils/printify";

export async function GET() {
  const raw = await fetchPrintifyProducts();
  const all = raw.map(mapToLocal);

  const payload = all.map((p) => ({
    _id:         p.slug,
    title:       p.title,
    description: p.description,
    price:       p.price,
    imageUrl:    p.images[0] || "/placeholder.png",
  }));

  return NextResponse.json(payload);
}