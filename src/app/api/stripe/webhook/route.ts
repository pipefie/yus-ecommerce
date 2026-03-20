/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server"
import Stripe from "stripe"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { createPrintfulOrderForLocalOrder, type Recipient } from "@/utils/printful"
import { pushOrderToMailchimp } from "@/actions/marketing"
import { sendOrderConfirmation } from "@/lib/emails/sendOrderConfirmation"
import { stripe as stripeClient } from "@/utils/stripe"
import logger from "@/lib/logger"

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
  const secret = env.STRIPE_WEBHOOK_SECRET

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload.toString()}`)
    .digest("hex")

  const sigBuf = Buffer.from(signature, "hex")
  const expBuf = Buffer.from(expected, "hex")
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
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

    // Find existing order to check for idempotency
    const existing = await prisma.order.findUnique({ where: { stripeSessionId: session.id } })

    // Mark the order as paid (idempotent: skip if already past pending)
    const alreadyProcessed = existing?.status === "paid" || existing?.status === "fulfilled"
    const order = alreadyProcessed
      ? existing
      : await prisma.order.update({
          where: { stripeSessionId: session.id },
          data: { status: "paid" },
        })

    if (!order) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    if (!alreadyProcessed) {
      await pushOrderToMailchimp(
        session.customer_email || "",
        String(order.id),
        order.totalAmount
      )

      // Send order confirmation email
      if (session.customer_email) {
        try {
          const lineItems = await stripeClient.checkout.sessions.listLineItems(session.id, { limit: 100 })
          const lines = lineItems.data.map((item) => ({
            name: item.description ?? 'Item',
            quantity: item.quantity ?? 1,
            unitPriceCents: item.amount_total ?? 0,
            currency: session.currency ?? 'eur',
          }))
          await sendOrderConfirmation({
            to: session.customer_email,
            customerName: (session as any).customer_details?.name ?? undefined,
            orderId: order.id,
            lines,
            totalCents: session.amount_total ?? order.totalAmount,
            currency: session.currency ?? 'eur',
          })
        } catch (e) {
          logger.error({ err: e, orderId: order.id }, 'Order confirmation email failed')
        }
      }

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
        logger.error({ err: e }, 'Printful order submit failed — will need manual retry')
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

