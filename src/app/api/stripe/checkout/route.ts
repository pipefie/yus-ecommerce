// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { assertCsrf } from "@/utils/csrf"
import { stripe } from "@/utils/stripe"
import dbConnect from "@/utils/dbConnect"
import Order from "@/models/Order"

interface CheckoutItem {
  _id: string
  title: string
  imageUrl: string
  price: number
  quantity: number
}

export async function POST(req: NextRequest) {
  const csrfError = assertCsrf(req)
  if (csrfError) return csrfError
  const {
    items,
    currency,
    customerEmail,
    userId,
  }: { items: CheckoutItem[]; currency: string; customerEmail?: string; userId?: string } =
    await req.json()

  // Build Stripe line items
  const line_items = items.map((i: CheckoutItem) => ({
    price_data: {
      currency: currency.toLowerCase(),
      product_data: { name: i.title, images: [i.imageUrl] },
      unit_amount: Math.round(i.price),
    },
    quantity: i.quantity,
  }))

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    customer_email: customerEmail,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
  })

  // Create a local Order in “pending” state
  await dbConnect()
  await Order.create({
    userId,
    stripeSessionId: session.id,
    items: items.map((i: CheckoutItem) => ({
      productId: i._id,
      quantity:  i.quantity,
      price:     Math.round(i.price * 100),
    })),
    totalAmount: session.amount_total!,
    currency:    session.currency!,
    status:      "pending",
  })

  return NextResponse.json({ url: session.url })
}
