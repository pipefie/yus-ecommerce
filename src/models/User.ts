// src/models/User.ts
// src/models/User.ts
import mongoose, { Document, Model } from "mongoose"

export interface IUser extends Document {
  email: string
  name: string
  password: string      // hashed
  role: 'user' | 'admin'
  phone?: string
  age?: number
  location?: string
  newsletterOptIn: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: String,
    age: Number,
    location: String,
    newsletterOptIn: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const User: Model<IUser> =
  mongoose.models.User as Model<IUser> ||
  mongoose.model<IUser>("User", UserSchema)

export default User