// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { variantId, quantity } = await req.json();
  const existing = req.cookies.get('cart')?.value
    ? JSON.parse(req.cookies.get('cart')!.value)
    : [];
  const updated = [...existing, { variantId, quantity }];
  return NextResponse.json({ cart: updated }, {
    headers: { 'Set-Cookie': `cart=${JSON.stringify(updated)}; Path=/; HttpOnly` }
  });
}