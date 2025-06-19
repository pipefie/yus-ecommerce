// src/app/api/stripe/webhook/route.ts
import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/utils/stripe"
import Order from "@/models/Order"
import dbConnect from "@/utils/dbConnect"

export const config = {
  api: { bodyParser: false } // Stripe needs raw body
}

export async function POST(req: Request) {
  const buf = await req.arrayBuffer()
  const buffer = Buffer.from(buf)
  const sig = req.headers.get("stripe-signature")!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buffer, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    await dbConnect()
    // Mark the order as paid
    await Order.findOneAndUpdate(
      { stripeSessionId: session.id },
      { $set: { status: "paid" } }
    )
  }

  return new NextResponse("Received", { status: 200 })
}
