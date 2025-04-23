// src/app/api/printful/orders/route.ts
import { NextResponse } from "next/server"
import { BASE, KEY } from "@/utils/printful"

export async function POST(req: Request) {
  const { recipient, items, shipping } = await req.json()
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient, items, shipping }),
  })
  const payload = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: payload }, { status: res.status })
  }
  return NextResponse.json(payload)
}
