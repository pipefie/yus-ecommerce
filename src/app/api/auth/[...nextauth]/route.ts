import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_ID!,
        clientSecret: process.env.GOOGLE_SECRET!,
      }),
      // add other OAuth providers here...
    ],
    session: {
      strategy: "jwt",       // ✅ literal type, not generic string
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
    },
    pages: {
      signIn: "/auth/signin", // optional custom sign-in page
    },
  }
  
// Create the handler
const handler = NextAuth(authOptions)
// Export it for both GET and POST
export { handler as GET, handler as POST }