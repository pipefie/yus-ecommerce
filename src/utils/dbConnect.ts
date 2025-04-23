// Description: This file is used to connect to the MongoDB database using Mongoose.
// It exports a function that establishes the connection and caches it for future use.
// It also checks if the MONGO_URI environment variable is defined and throws an error if not.
// The connection is cached to avoid multiple connections to the database.
// The function returns the cached connection if it exists, otherwise it creates a new connection.
// The connection is established using the MONGO_URI environment variable.
// The connection is established using the mongoose.connect() method, which returns a promise that resolves to the connection object.
// The connection is cached in the global object to avoid multiple connections to the database.
// The connection is established using the MONGO_URI environment variable, which is defined in the .env.local file.
import mongoose from 'mongoose'
const MONGO_URI = process.env.MONGO_URI!
if (!MONGO_URI) throw new Error('Define MONGO_URI in .env.local')

let cached = (global as any).mongoose
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}
export default async function dbConnect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then(m => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}
