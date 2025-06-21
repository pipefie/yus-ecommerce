import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import dbConnect from "@/utils/dbConnect"
import User from "@/models/User"
import Order from "@/models/Order"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  await dbConnect()
  const user = await User.findById(session.user.id).lean()
  const orders = await Order.find({ userId: session.user.id }).lean()
  return NextResponse.json({ user, orders })
}