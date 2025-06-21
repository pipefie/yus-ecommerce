import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import dbConnect from "@/utils/dbConnect"
import User from "@/models/User"
import Order from "@/models/Order"

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  await dbConnect()
  await Order.deleteMany({ userId: session.user.id })
  await User.findByIdAndDelete(session.user.id)
  return NextResponse.json({ success: true })
}