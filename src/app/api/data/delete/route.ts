import { NextResponse } from "next/server"
import auth0 from "@/lib/auth0"
import dbConnect from "@/utils/dbConnect"
import User from "@/models/User"
import Order from "@/models/Order"

export async function DELETE() {
  const session = await auth0.getSession()
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  await dbConnect()
  const userId = (session.user as { sub: string }).sub
  await Order.deleteMany({ userId })
  await User.findByIdAndDelete(userId)
  return NextResponse.json({ success: true })
}