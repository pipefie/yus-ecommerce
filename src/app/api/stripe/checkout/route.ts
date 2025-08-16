// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { assertCsrf } from "@/utils/csrf"
import { stripe } from "@/utils/stripe"
import auth0 from "@/lib/auth0"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Prisma } from "@prisma/client"

export const runtime = "nodejs"

const ItemSchema = z.object({
  _id: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
})

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1),
  currency: z.string().optional(),
})

export async function POST(req: NextRequest) {
  // 1) CSRF
  const csrfError = assertCsrf(req)
  if (csrfError) return csrfError

  // 2) Parse input
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid items" }, { status: 400 })
  }
  const { items } = parsed.data

  // 3) Auth (server-derived identity; do NOT trust client)
  let email: string | undefined
  try {
    const session = await auth0.getSession() // no-arg is safer in App Router
    email = session?.user?.email
  } catch {
    // proceed as guest
  }

  // 4) Re-load authoritative product/variant data from Prisma.
  //    Accept either numeric product IDs OR slugs in items[i]._id
  const numericIds: number[] = []
  const slugs: string[] = []
  for (const it of items) {
    const n = Number(it._id)
    if (Number.isFinite(n) && String(n) === it._id) {
      numericIds.push(n)
    } else {
      // simple sanity guard to avoid absurd values; Prisma uses params anyway
      if (typeof it._id !== "string" || it._id.length > 200) {
        return NextResponse.json({ error: `Invalid product id: ${it._id}` }, { status: 400 })
      }
      slugs.push(it._id)
    }
  }

  let products
  try {
    const or: Record<string, unknown>[] = []
    if (numericIds.length) or.push({ id: { in: numericIds } })
    if (slugs.length) or.push({ slug: { in: slugs } })
    products = await prisma.product.findMany({
      where: { OR: or },
      include: { variants: true },
    })
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
  // 5) Build Stripe line_items (EUR) from authoritative data
  let line_items
  try {
    line_items = items.map((i) => {
      const pidNum = Number(i._id)
      const product =
        Number.isFinite(pidNum) && String(pidNum) === i._id
          ? products.find((p) => p.id === pidNum)
          : products.find((p) => p.slug === i._id)

      if (!product) {
        throw new Error(`Product not found: ${i._id}`)
      }

      const vid = i.variantId ? Number(i.variantId) : undefined
      const variant = Number.isFinite(vid) ? product.variants.find((v) => v.id === vid) : null

      const unitAmountCents = variant?.price ?? product.price // INT cents from DB
      if (!Number.isFinite(unitAmountCents) || unitAmountCents <= 0) {
        throw new Error(`Invalid price for ${i._id}`)
      }

      const qty = Math.max(1, Math.min(50, Number.isFinite(i.quantity) ? i.quantity : 1))

      let images: string[] = []
      if (variant?.previewUrl) {
        images = [variant.previewUrl]
      } else if (Array.isArray(product.images)) {
        images = (product.images as unknown as string[]).filter(
          (x): x is string => typeof x === "string",
        )
      }

      return {
        price_data: {
          currency: "eur",
          product_data: { name: product.title, images: images.slice(0, 1) },
          unit_amount: Math.round(unitAmountCents), // integer cents
        },
        quantity: qty,
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid items"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // 6) Create Stripe session
  let checkout
  try {
    checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: email, // optional for guests
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
    })
  } catch {
    return NextResponse.json({ error: "Stripe error" }, { status: 500 })
  }

  // 7) Persist Order (pending) using Prisma
  const orderItems: Prisma.JsonArray = items.map((i) => {
    const pidNum = Number(i._id)
    const product =
      Number.isFinite(pidNum) && String(pidNum) === i._id
        ? products.find((p) => p.id === pidNum)!
        : products.find((p) => p.slug === i._id)!
    const vid = i.variantId ? Number(i.variantId) : undefined
    const variant = Number.isFinite(vid) ? product.variants.find((v) => v.id === vid) : null
    const unitCents = Math.round(variant?.price ?? product.price)
    return {
      productId: product.id,
      variantId: Number.isFinite(vid) ? (vid as number) : null,
      quantity: i.quantity,
      unitPriceCents: unitCents,
    }
  })

  try {
    await prisma.order.create({
      data: {
        // optional: link to local user if you keep a users table synced to auth emails
        // userId: ...
        stripeSessionId: checkout.id,
        items: orderItems as Prisma.InputJsonValue, // Json field
        totalAmount: checkout.amount_total!, // integer cents from Stripe
        currency: (checkout.currency ?? "eur").toLowerCase(),
        status: "pending",
      },
    })
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ url: checkout.url }, { status: 200 })
}
