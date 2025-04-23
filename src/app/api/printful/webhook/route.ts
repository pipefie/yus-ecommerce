// src/app/api/printful/webhook/route.ts
import { NextResponse } from "next/server"
import crypto from "crypto"

const SECRET = process.env.PRINTFUL_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const raw = await req.text()
  const sig = req.headers.get("X-PF-Signature") || ""
  const hmac = crypto.createHmac("sha256", SECRET).update(raw).digest("hex")
  if (sig !== hmac) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }
  const event = JSON.parse(raw)
  // TODO: handle event.type (orders/fulfilled, etc.)—update your DB or notify customer
  return NextResponse.json({ received: true })
}
