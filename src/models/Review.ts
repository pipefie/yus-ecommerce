import mongoose, { Document, Model } from "mongoose"

export interface IReview extends Document {
  productSlug: string
  author: string
  rating: number
  comment: string
  createdAt: Date
}

const ReviewSchema = new mongoose.Schema<IReview>(
  {
    productSlug: { type: String, required: true },
    author:    { type: String, required: true },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    comment:   { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const Review: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>("Review", ReviewSchema)

export default Review