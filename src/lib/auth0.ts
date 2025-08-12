// src/lib/auth0.ts (v4)
import { Auth0Client } from '@auth0/nextjs-auth0/server'

const auth0 = new Auth0Client({
  // You can omit these if you set the env vars below; keeping here for clarity
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL ?? 'http://localhost:3000',
  appBaseUrl: process.env.APP_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  authorizationParameters: {
    scope: 'openid profile email offline_access'
  },
  session: {
    rolling: true,
    absoluteDuration: 60 * 60,
    cookie: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
      // httpOnly is always true in v4
    }
  }
})

export default auth0

