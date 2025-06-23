import { NextRequest, NextResponse } from 'next/server'
import { assertCsrf } from '@/utils/csrf'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {})

export type CartItem = {
    title: string
    imageUrl: string
    price: number
    quantity: number
}

export async function POST(req: NextRequest) {
  const csrfError = assertCsrf(req)
  if (csrfError) return csrfError
  const { items, currency }: { items: CartItem[]; currency: string } = await req.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map((i: CartItem) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: i.title, images: [i.imageUrl] },
        unit_amount: Math.round(i.price),
      },
      quantity: i.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
  })
  return NextResponse.json({ url: session.url })
}
