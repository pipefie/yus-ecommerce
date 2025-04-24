// src/app/api/printful-sync/route.ts
import { NextResponse } from "next/server"
import dbConnect from "@/utils/dbConnect"
import Product from "@/models/Product"
import { fetchPrintfulProducts, mapToLocal } from "@/utils/printful"

export async function GET() {
  try {
    await dbConnect()
    const pfProducts = await fetchPrintfulProducts()

    let syncedCount = 0
    for (const pf of pfProducts) {
      try {
        const data = mapToLocal(pf)
        await Product.findOneAndUpdate(
          { printfulId: data.printfulId },
          { $set: data },
          { upsert: true }
        )
        syncedCount++
      } catch (itemErr) {
        console.warn(`⚠️ Skipping product ${pf.id}:`, itemErr)
      }
    }

    return NextResponse.json({ synced: syncedCount })
  } catch (err: any) {
    console.error("💥 /api/printful-sync error:", err)
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    )
  }
}
