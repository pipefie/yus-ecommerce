// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server"
import dbConnect from "@/utils/dbConnect"
import User from "@/models/User"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  const { name, email, password, newsletterOptIn } = await req.json()
  await dbConnect()

  // Check existing
  if (await User.findOne({ email })) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 })
  }

  // Hash & create
  const hash = await bcrypt.hash(password, 10)
  await User.create({ name, email, password: hash, newsletterOptIn })

  return NextResponse.json({ ok: true })
}
