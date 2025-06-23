// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server"
import { assertCsrf } from "../../../../utils/csrf"
import dbConnect from "@/utils/dbConnect"
import User from "@/models/User"
import bcrypt from "bcrypt"
import NewsletterSubscription from "@/models/NewsletterSubscription"
import { sendWelcomeEmail } from "@/utils/sendgrid"
import { pushCustomerToMailchimp } from "@/actions/marketing"

export async function POST(req: NextRequest) {
  const csrfError = assertCsrf(req)
  if (csrfError) return csrfError
  const { name, email, password, newsletterOptIn } = await req.json()
  await dbConnect()

  // Check existing
  if (await User.findOne({ email })) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 })
  }

  // Hash & create
  const hash = await bcrypt.hash(password, 10)
  await User.create({ name, email, password: hash, newsletterOptIn, role: 'user' })
  try {
    await sendWelcomeEmail(email, name)
    await pushCustomerToMailchimp(email, name)
  } catch (err) {
    console.error('Post-signup actions failed:', err)
  }

  if (newsletterOptIn) {
    try {
      await NewsletterSubscription.create({ email })
    } catch (err) {
      // ignore duplicate entries or other errors
      console.error('Newsletter subscription failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
