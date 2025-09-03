// src/lib/auth0.ts
// Singleton Auth0 client using the v4 SDK to support App Router.
// Exposes getSession() that works in server components and route handlers.

import { Auth0Client } from '@auth0/nextjs-auth0/server'

export type Session = {
  user?: Record<string, any>
} | null

declare global {
  // eslint-disable-next-line no-var
  var __auth0Client: Auth0Client | undefined
}

function createClient() {
  const {
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET,
    AUTH0_SECRET,
    AUTH0_BASE_URL,
  } = process.env

  return new Auth0Client({
    domain: AUTH0_DOMAIN!,
    clientId: AUTH0_CLIENT_ID!,
    clientSecret: AUTH0_CLIENT_SECRET!,
    appBaseUrl: AUTH0_BASE_URL!,
    secret: AUTH0_SECRET!,
  })
}

const client = globalThis.__auth0Client ?? createClient()
if (process.env.NODE_ENV !== 'production') {
  globalThis.__auth0Client = client
}

const auth0 = {
  getSession: async (): Promise<Session> => {
    try {
      return await client.getSession()
    } catch {
      return null
    }
  },
  middleware: client.middleware.bind(client),
}

export default auth0
