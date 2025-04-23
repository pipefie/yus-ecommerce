import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {})

export type CartItem = {
    title: string
    imageUrl: string
    price: number
    quantity: number
}

export async function POST(req: Request) {
  const { items }: { items: CartItem[] } = await req.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map((i: CartItem) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: i.title, images: [i.imageUrl] },
        unit_amount: Math.round(i.price * 100),
      },
      quantity: i.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
  })
  return NextResponse.json({ url: session.url })
}
