// src/lib/auth0.ts
// Minimal wrapper to use Auth0 in App Router
import { getSession } from '@auth0/nextjs-auth0'

const auth0 = {
  getSession,
}

export default auth0
