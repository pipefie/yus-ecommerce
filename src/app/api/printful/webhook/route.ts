/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const type: string = (body as any).type || ""
  const product = (body as any).data?.product || (body as any).data || {}
  const id = String((product as any).id || "")

  try {
    if (type === "product.delete" || type === "product.deleted" || type === "product-delete") {
      if (id) {
        await prisma.product.update({
          where: { printifyId: id },
          data: { deleted: true },
        })
      }
    } else {
      if (id) {
        await prisma.product.upsert({
          where: { printifyId: id },
          update: {
            slug: product.slug,
            title: product.title,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl || product.image || "",
            images: product.images || [],
            deleted: false,
          },
          create: {
            printifyId: id,
            slug: product.slug,
            title: product.title,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl || product.image || "",
            images: product.images || [],
            deleted: false,
          },
        })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
