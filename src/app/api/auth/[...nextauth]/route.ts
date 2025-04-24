// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import bcrypt from "bcrypt"
import dbConnect from "@/utils/dbConnect"
import User from "@/models/User"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect()
        const user = await User.findOne({ email: credentials!.email })
        if (!user) return null
        const isValid = await bcrypt.compare(credentials!.password, user.password)
        if (!isValid) return null

        // Return object will become the JWT token payload
        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt:       "consent",        // always ask consent
          access_type:  "offline",        // ensures a refresh token
          response_type:"code",
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID!,
      clientSecret: process.env.FACEBOOK_SECRET!,
    }),
    // ...other OAuth providers...
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, `user` will be set
      if (user) {
        token.sub = user.id   // guaranteed because authorize returned string id
      }
      return token
    },
    async session({ session, token }) {
      // token.sub can be string or undefined
      if (typeof token.sub === "string") {
        session.user.id = token.sub   // safe assignment
      } else {
        session.user.id = ""          // or handle however you want
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
