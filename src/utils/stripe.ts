// src/utils/stripe.ts
import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not defined")
  }
  _stripe = new Stripe(secretKey, {
    maxNetworkRetries: 2,
    timeout: 10000,
  })
  return _stripe
}

// Back-compat proxy for code importing { stripe }
export const stripe = new Proxy({}, {
  get(_target, prop) {
    const s = getStripe() as any
    return s[prop]
  }
}) as unknown as Stripe
