// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server"
import Stripe from "stripe"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { createPrintfulOrderForLocalOrder, type Recipient } from "@/utils/printful"
import { pushOrderToMailchimp } from "@/actions/marketing"

export const config = {
  api: { bodyParser: false } // Stripe needs raw body
}

export const runtime = "nodejs"

export async function POST(req: Request) {
  if (req.headers.get("x-forwarded-proto") !== "https") {
    return NextResponse.json({ error: "Insecure protocol" }, { status: 400 })
  }

  const sigHeader = req.headers.get("stripe-signature")
  if (!sigHeader) {
    return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 })
  }

  const [tPart, v1Part] = sigHeader.split(",")
  const timestamp = Number(tPart?.split("=")[1])
  const signature = v1Part?.split("=")[1]
  if (!timestamp || !signature) {
    return NextResponse.json(
      { error: "Invalid Stripe-Signature header" },
      { status: 400 }
    )
  }

  if (Date.now() - timestamp * 1000 > 5 * 60 * 1000) {
    return NextResponse.json({ error: "Stale Stripe signature" }, { status: 400 })
  }

  const buf = await req.arrayBuffer()
  const payload = Buffer.from(buf)
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload.toString()}`)
    .digest("hex")

  if (expected !== signature) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  let event: Stripe.Event
  try {
    event = JSON.parse(payload.toString()) as Stripe.Event
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid payload"
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session


    // Mark the order as paid
    const order = await prisma.order.update({
      where: { stripeSessionId: session.id },
      data: { status: "paid" }
    })
    await pushOrderToMailchimp(
      session.customer_email || "",
      String(order.id),
      order.totalAmount
    )

    // Attempt to submit the order to Printful if we have shipping details
    try {
      const cd: any = (session as any).customer_details
      const addr: any = cd?.address
      if (addr && cd?.name) {
        const recipient: Recipient = {
          name: cd.name,
          email: session.customer_email || undefined,
          phone: (cd as any).phone || undefined,
          address1: addr.line1,
          address2: addr.line2 || undefined,
          city: addr.city,
          state_code: addr.state || (addr as any).state_code || undefined,
          country_code: addr.country,
          zip: addr.postal_code,
        }
        await createPrintfulOrderForLocalOrder(order.id, recipient)
      }
    } catch (e) {
      console.error('Printful order submit failed', e)
      // Non-fatal: order remains paid, can be retried
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
