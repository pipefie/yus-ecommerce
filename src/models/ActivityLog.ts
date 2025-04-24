// src/models/ActivityLog.ts
import mongoose, { Document, Model } from "mongoose"

export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId
  event: string
  metadata?: any
  createdAt: Date
}

const ActivityLogSchema = new mongoose.Schema<IActivityLog>(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    event:    { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog as Model<IActivityLog> ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema)

export default ActivityLog
