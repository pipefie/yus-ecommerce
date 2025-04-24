import mongoose, { Document, Model } from "mongoose"

export interface IInvoice extends Document {
  orderId: mongoose.Types.ObjectId  // Reference to local Order
  stripeInvoiceId: string           // ID of the Stripe invoice
  amountDue: number                 // in cents
  currency: string                  // e.g. "usd"
  status: "draft" | "open" | "paid" | "uncollectible" | "void"
  hostedInvoiceUrl?: string        // URL to Stripe-hosted invoice
  createdAt: Date                   // invoice creation timestamp
}

const InvoiceSchema = new mongoose.Schema<IInvoice>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    stripeInvoiceId: { type: String, required: true, unique: true },
    amountDue: { type: Number, required: true },
    currency: { type: String, required: true, default: "usd" },
    status: {
      type: String,
      enum: ["draft", "open", "paid", "uncollectible", "void"],
      default: "draft",
    },
    hostedInvoiceUrl: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const Invoice: Model<IInvoice> =
  (mongoose.models.Invoice as Model<IInvoice>) ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema)

export default Invoice
