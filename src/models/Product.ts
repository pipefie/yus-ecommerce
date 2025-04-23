import mongoose, { Document, Model } from 'mongoose'

// Interface for Product including Printful integration fields
export interface IProduct extends Document {
  printfulId: number
  printfulVariantId: number
  title: string
  slug: string
  description: string
  price: number       // in cents
  imageUrl: string
  nsfw?: boolean
  updatedAt: Date
}

// Mongoose schema corresponding to the IProduct interface
const ProductSchema = new mongoose.Schema<IProduct>(
  {
    printfulId:        { type: Number, required: true, unique: true },
    printfulVariantId: { type: Number, required: true },
    title:             { type: String, required: true },
    slug:              { type: String, required: true, unique: true },
    description:       { type: String, default: '' },
    price:             { type: Number, required: true },
    imageUrl:          { type: String, default: '' },
    nsfw:              { type: Boolean, default: false },
    updatedAt:         { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Create or reuse the Product model
const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema)

export default Product

