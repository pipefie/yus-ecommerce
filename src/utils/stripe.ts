// src/utils/stripe.ts
import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined")
}
// Instantiate Stripe without overriding apiVersion
export const stripe = new Stripe(secretKey, {
  // You can add `maxNetworkRetries`, `timeout`, etc. here
  // Leave apiVersion unset to use your account's default (e.g. "2025-03-31.basil")
})