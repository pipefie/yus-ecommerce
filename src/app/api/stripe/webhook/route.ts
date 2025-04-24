// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/utils/stripe"
import Order from "@/models/Order"
import dbConnect from "@/utils/dbConnect"

export const config = {
  api: { bodyParser: false } // Stripe needs raw body
}

export default async function handler(req: any) {
  const buf = await req.arrayBuffer()
  const sig = req.headers["stripe-signature"]!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
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
