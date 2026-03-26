// src/utils/stripe.ts
import Stripe from "stripe"
import { env } from "@/lib/env"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance
  const secretKey = env.STRIPE_SECRET_KEY
  stripeInstance = new Stripe(secretKey, {
    maxNetworkRetries: 2,
    timeout: 10000,
  })
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const instance = getStripe() as unknown as Record<PropertyKey, unknown>
    const value = Reflect.get(instance, prop, receiver)
    if (typeof value === "function") {
      return value.bind(instance)
    }
    return value
  },
}) as Stripe
