import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  fetchPrintfulProducts,
  fetchPrintfulProductDetail,
  mapToSummary,
  mapToDetail,
} from "@/utils/printful"

export async function GET() {
  try {

    const rawList = await fetchPrintfulProducts()
    const summaries = rawList.map(mapToSummary)

    for (const sum of summaries) {
      const rawDetail = await fetchPrintfulProductDetail(sum.printfulProductId)
      const detail = mapToDetail(sum.slug, rawDetail)
      const basePrice =
        detail.variants.reduce(
          (min, v) => Math.min(min, v.price),
          Infinity
        ) || 0

      await prisma.product.upsert({
        where: { printfulProductId: String(detail.printfulProductId) },
        update: {
          slug:        detail.slug,
          title:       detail.title,
          description: detail.description,
          price:       basePrice,
          imageUrl:    detail.images[0] ?? "",
          images:      detail.images,
        },
        create: {
          printfulProductId:  String(detail.printfulProductId),
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
          where: { printfulVariantId: String(v.id) },
          update: {
            product:    { connect: { printfulProductId: String(detail.printfulProductId) } },
            price:      v.price,
            color:      v.color,
            size:       v.size,
            imageUrl:   v.designUrls[0] ?? "",
            previewUrl: v.designUrls[0] ?? "",
            designUrls: v.designUrls,
          },
          create: {
            printfulVariantId: String(v.id),
            product:    { connect: { printfulProductId: String(detail.printfulProductId) } },
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