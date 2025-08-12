// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { assertCsrf } from "@/utils/csrf"
import { stripe } from "@/utils/stripe"
import auth0 from "@/lib/auth0"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

type ItemInput = { _id: string; variantId?: string; quantity: number }

export async function POST(req: NextRequest) {
  // 1) CSRF
  const csrfError = assertCsrf(req)
  if (csrfError) return csrfError

  // 2) Parse input
  const { items }: { items: ItemInput[]; currency?: string } = await req.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 })
  }

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

  const products = await prisma.product.findMany({
    where: {
      OR: [
        numericIds.length ? { id: { in: numericIds } } : undefined,
        slugs.length ? { slug: { in: slugs } } : undefined,
      ].filter(Boolean) as any,
    },
    include: { variants: true },
  })

  // 5) Build Stripe line_items (EUR) from authoritative data
  const line_items = items.map((i) => {
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

  // 6) Create Stripe session
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    customer_email: email, // optional for guests
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
  })

  // 7) Persist Order (pending) using Prisma
  const orderItems = items.map((i) => {
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

  await prisma.order.create({
    data: {
      // optional: link to local user if you keep a users table synced to auth emails
      // userId: ...
      stripeSessionId: checkout.id,
      items: orderItems as unknown as any, // Json field
      totalAmount: checkout.amount_total!, // integer cents from Stripe
      currency: (checkout.currency ?? "eur").toLowerCase(),
      status: "pending",
    },
  })

  return NextResponse.json({ url: checkout.url }, { status: 200 })
}
