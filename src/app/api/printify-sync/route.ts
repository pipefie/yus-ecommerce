import { NextResponse } from "next/server"
import dbConnect from "@/utils/dbConnect"
import Product from "@/models/Product"
import {
  fetchPrintifyProducts,
  fetchPrintifyProductDetail,
  mapToSummary,
  mapToDetail,
} from "@/utils/printify"

export async function GET() {
  try {
    await dbConnect()

    const rawList = await fetchPrintifyProducts()
    const summaries = rawList.map(mapToSummary)

    for (const sum of summaries) {
      const rawDetail = await fetchPrintifyProductDetail(sum.printifyId)
      const detail = mapToDetail(sum.slug, rawDetail)

      const variants = detail.variants.map((v) => ({
        id: v.id,
        price: v.price,
        size: v.size,
        color: v.color,
        imageUrl: v.designUrl,
      }))

      await Product.findOneAndUpdate(
        { printifyId: detail.printifyId },
        {
          printifyId: detail.printifyId,
          title: detail.title,
          slug: detail.slug,
          description: detail.description,
          variants,
          images: detail.images,
          updatedAt: new Date(),
        },
        { upsert: true }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("printful-sync error", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}