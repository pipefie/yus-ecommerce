// src/models/NewsletterSubscription.ts
import mongoose, { Document, Model } from "mongoose"

export interface INewsletterSubscription extends Document {
  email: string
  subscribedAt: Date
}

const NewsletterSchema = new mongoose.Schema<INewsletterSubscription>({
  email:        { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now }
})

const Newsletter: Model<INewsletterSubscription> =
  mongoose.models.NewsletterSubscription as Model<INewsletterSubscription> ||
  mongoose.model<INewsletterSubscription>("NewsletterSubscription", NewsletterSchema)

export default Newsletter
