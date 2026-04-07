# ─── Stage 1: install dependencies ───────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time only placeholders — ARG values never persist into the final image.
# Real secrets are injected at runtime via env_file in docker-compose.
ARG SKIP_ENV_VALIDATION=1
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_URL=http://localhost:3000
ARG OIDC_ISSUER=https://placeholder.auth0.com/
ARG OIDC_CLIENT_ID=build
ARG OIDC_CLIENT_SECRET=build
ARG OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback
ARG OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
ARG SESSION_SECRET=00000000000000000000000000000000
ARG STRIPE_SECRET_KEY=sk_test_build
ARG STRIPE_WEBHOOK_SECRET=whsec_build
ARG CLOUDFRONT_BASE_URL=https://placeholder.cloudfront.net

# Expose ARGs as env vars only for the RUN step below
# Generate Prisma client then build (output: standalone)
RUN SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION \
    DATABASE_URL=$DATABASE_URL \
    BASE_URL=$BASE_URL \
    NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL \
    OIDC_ISSUER=$OIDC_ISSUER \
    OIDC_CLIENT_ID=$OIDC_CLIENT_ID \
    OIDC_CLIENT_SECRET=$OIDC_CLIENT_SECRET \
    OIDC_REDIRECT_URI=$OIDC_REDIRECT_URI \
    OIDC_POST_LOGOUT_REDIRECT_URI=$OIDC_POST_LOGOUT_REDIRECT_URI \
    SESSION_SECRET=$SESSION_SECRET \
    STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
    STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET \
    CLOUDFRONT_BASE_URL=$CLOUDFRONT_BASE_URL \
    npx prisma generate && \
    SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION \
    DATABASE_URL=$DATABASE_URL \
    BASE_URL=$BASE_URL \
    NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL \
    OIDC_ISSUER=$OIDC_ISSUER \
    OIDC_CLIENT_ID=$OIDC_CLIENT_ID \
    OIDC_CLIENT_SECRET=$OIDC_CLIENT_SECRET \
    OIDC_REDIRECT_URI=$OIDC_REDIRECT_URI \
    OIDC_POST_LOGOUT_REDIRECT_URI=$OIDC_POST_LOGOUT_REDIRECT_URI \
    SESSION_SECRET=$SESSION_SECRET \
    STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
    STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET \
    CLOUDFRONT_BASE_URL=$CLOUDFRONT_BASE_URL \
    npm run build

# ─── Stage 3: production runner ───────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Apply latest Debian security patches at image build time
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# Standalone bundle (server.js + minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Static assets served by Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public        ./public

# Prisma schema + migrations (needed by migrate deploy at startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prisma CLI + generated client (not included in standalone bundle)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma*       ./node_modules/.bin/
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma             ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma            ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma            ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Run migrations then start the standalone server
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
