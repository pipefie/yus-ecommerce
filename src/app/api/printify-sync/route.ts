import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestLogger } from "@/lib/logger"
import {
  fetchPrintifyProducts,
  fetchPrintifyProductDetail,
  mapToSummary,
  mapToDetail,
} from "@/utils/printify"

export async function GET(req: NextRequest) {
  const logger = getRequestLogger(req)
  try {

    const rawList = await fetchPrintifyProducts()
    const summaries = rawList.map(mapToSummary)

    for (const sum of summaries) {
      const rawDetail = await fetchPrintifyProductDetail(sum.printifyId)
      const detail = mapToDetail(sum.slug, rawDetail)
      const basePrice =
        detail.variants.reduce(
          (min, v) => Math.min(min, v.price),
          Infinity
        ) || 0

 await prisma.product.upsert({
        where: { printifyId: String(detail.printifyId) },
        update: {
          slug:        detail.slug,
          title:       detail.title,
          description: detail.description,
          price:       basePrice,
          imageUrl:    detail.images[0] ?? "",
          images:      detail.images,
        },
        create: {
          printifyId:  String(detail.printifyId),
          slug:        detail.slug,
          title:       detail.title,
          description: detail.description,
          price:       basePrice,
          imageUrl:    detail.images[0] ?? "",
          images:      detail.images,
        },
      })

      for (const v of detail.variants) {
        await prisma.variant.upsert({
          where: { printifyId: String(v.id) },
          update: {
            product:    { connect: { printifyId: String(detail.printifyId) } },
            price:      v.price,
            color:      v.color,
            size:       v.size,
            imageUrl:   v.designUrls[0] ?? "",
            previewUrl: v.designUrls[0] ?? "",
            designUrls: v.designUrls,
          },
          create: {
            printifyId: String(v.id),
            product:    { connect: { printifyId: String(detail.printifyId) } },
            price:      v.price,
            color:      v.color,
            size:       v.size,
            imageUrl:   v.designUrls[0] ?? "",
            previewUrl: v.designUrls[0] ?? "",
            designUrls: v.designUrls,
          },
        })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error("printful-sync error", err)
    const message = err instanceof Error ? err.message : "Unknown error"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}