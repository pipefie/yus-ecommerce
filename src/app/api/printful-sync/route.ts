// src/app/api/printful-sync/route.ts
import { NextResponse } from "next/server"
import dbConnect from "@/utils/dbConnect"
import Product from "@/models/Product"
import { fetchPrintfulProducts, mapToLocal } from "@/utils/printful"

export async function GET() {
  await dbConnect()
  const pfProducts = await fetchPrintfulProducts()
  let count = 0

  for (const pf of pfProducts) {
    const data = mapToLocal(pf)
    await Product.findOneAndUpdate(
      { printfulId: data.printfulId },
      { $set: data },
      { upsert: true }
    )
    count++
  }

  return NextResponse.json({ synced: count })
}
