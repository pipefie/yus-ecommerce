// src/models/Product.ts
import mongoose, { Document, Model } from 'mongoose'

// 1) Variant interface
export interface PFVariant {
  id:         number
  price:      number      // cents
  size?:      string
  color?:     string
  imageUrl:   string
  previewUrl?:string
}

// 2) Product interface now references an array of PFVariant, and images[]
export interface IProduct extends Document {
  printifyId: number
  printVariantId: number
  title:      string
  slug:       string
  description:string
  price:      number 
  imageUrl:   string 
  variants:   PFVariant[]
  images:     string[]
  nsfw:       boolean
  updatedAt:  Date
}

// 3) Define your sub‐schema for variants
const VariantSchema = new mongoose.Schema<PFVariant>(
  {
    id:         { type: Number, required: true },
    price:      { type: Number, required: true },
    size:       { type: String, required: true },
    color:      { type: String, required: true },
    imageUrl:   { type: String, required: true },
    previewUrl: { type: String },
  },
  { _id: false }
)

// 4) Full product schema
const ProductSchema = new mongoose.Schema<IProduct>(
  {
    printifyId:  { type: Number, required: true, unique: true },
    title:       { type: String, required: true },
    slug:        { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    variants:    { type: [VariantSchema], required: true },
    images:      { type: [String],        default: [] },
    nsfw:        { type: Boolean,         default: false },
    updatedAt:   { type: Date,            default: () => new Date() },
  },
  { timestamps: true }
)

const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema)

export default Product
