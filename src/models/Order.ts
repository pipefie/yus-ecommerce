// src/models/Order.ts
import mongoose, { Document, Model } from "mongoose"

interface LineItem { productId: string; quantity: number; price: number }

export interface IOrder extends Document {
  userId?: string       // nullable for guest checkouts
  stripeSessionId: string
  items: LineItem[]
  totalAmount: number     // in cents
  currency: string
  status: "pending"|"paid"|"fulfilled"|"refunded"
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    stripeSessionId: { type: String, required: true, unique: true },
    items: [
      {
        productId: { type: String, ref: "Product", required: true },
        quantity:  { type: Number, required: true },
        price:     { type: Number, required: true }
      }
    ],
    totalAmount: { type: Number, required: true },
    currency:    { type: String, required: true, default: "usd" },
    status:      { type: String, required: true, default: "pending" },
  },
  { timestamps: true }
)

const Order: Model<IOrder> =
  mongoose.models.Order as Model<IOrder> ||
  mongoose.model<IOrder>("Order", OrderSchema)

export default Order
