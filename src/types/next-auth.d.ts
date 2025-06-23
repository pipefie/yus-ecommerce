// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      /** The user's unique ID (from your database) */
      id: string
      role?: string
    } & DefaultSession["user"]
  }

  // optional: if you directly use `User` returned from authorize
  interface User {
    id: string
    role?: string
  }
}
