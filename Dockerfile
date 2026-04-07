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

# Dummy env vars for build stage only — satisfies Prisma schema check and Zod.
# Real values are injected at runtime via env_file in docker-compose. NOT in final image.
ENV SKIP_ENV_VALIDATION=1 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    BASE_URL=http://localhost:3000 \
    NEXT_PUBLIC_URL=http://localhost:3000 \
    OIDC_ISSUER=https://placeholder.auth0.com/ \
    OIDC_CLIENT_ID=build \
    OIDC_CLIENT_SECRET=build \
    OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback \
    OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/ \
    SESSION_SECRET=00000000000000000000000000000000 \
    STRIPE_SECRET_KEY=sk_test_build \
    STRIPE_WEBHOOK_SECRET=whsec_build \
    CLOUDFRONT_BASE_URL=https://placeholder.cloudfront.net

# Generate Prisma client then build (output: standalone)
RUN npx prisma generate && npm run build

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
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma        ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma             ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma            ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma            ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Run migrations then start the standalone server
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
