// src/utils/stripe.ts
import Stripe from "stripe"

// Instantiate Stripe without overriding apiVersion
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // You can add `maxNetworkRetries`, `timeout`, etc. here
  // Leave apiVersion unset to use your account's default (e.g. "2025-03-31.basil")
})