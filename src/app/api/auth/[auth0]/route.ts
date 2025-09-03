import { handleAuth } from '@auth0/nextjs-auth0'

// Auth0 route handlers for login, callback, logout, me
export const GET = handleAuth()
export const POST = handleAuth()

