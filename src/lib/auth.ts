import type { NextAuthOptions } from "next-auth"
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
        return { id: String(user._id), name: user.name, email: user.email }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID!,
      clientSecret: process.env.FACEBOOK_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
    async session({ session, token }) {
      session.user.id = typeof token.sub === "string" ? token.sub : ""
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
  },
  jwt: { secret: process.env.NEXTAUTH_SECRET! },
}