// src/models/Return.ts
import mongoose, { Document, Model } from "mongoose"

export interface IReturn extends Document {
  orderId: mongoose.Types.ObjectId
  items: { productId: mongoose.Types.ObjectId; quantity: number; }[]
  reason: string
  status: "requested"|"approved"|"completed"|"rejected"
  createdAt: Date
  updatedAt: Date
}

const ReturnSchema = new mongoose.Schema<IReturn>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity:  { type: Number, required: true }
      }
    ],
    reason: { type: String, required: true },
    status: { type: String, default: "requested" }
  },
  { timestamps: true }
)

const ReturnModel: Model<IReturn> =
  mongoose.models.Return as Model<IReturn> ||
  mongoose.model<IReturn>("Return", ReturnSchema)

export default ReturnModel
