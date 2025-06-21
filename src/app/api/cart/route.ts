// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { assertCsrf } from '@/utils/csrf';

export async function POST(req: NextRequest) {
  const csrfError = assertCsrf(req);
  if (csrfError) return csrfError;
  const { variantId, quantity } = await req.json();
  const existing = req.cookies.get('cart')?.value
    ? JSON.parse(decodeURIComponent(req.cookies.get('cart')!.value))
    : [];
  const updated = [...existing, { variantId, quantity }];
  return NextResponse.json({ cart: updated }, {
    headers: {
      'Set-Cookie': `cart=${encodeURIComponent(JSON.stringify(updated))}; Path=/; HttpOnly; Secure; SameSite=Lax`
    }
  });
}