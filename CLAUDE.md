# Y-US? — CLAUDE.md

Complete context for AI-assisted development. Read this before making any changes.

---

## What This Project Is

**Y-US?** is a print-on-demand e-commerce store selling graphic apparel. The brand aesthetic is "internet absurdity in wearable form" — intentionally weird, dark, chaotic, but premium-feeling. Products are designed in-house and printed/fulfilled via Printful (POD model, zero inventory). Payments via Stripe. The brand targets online culture consumers who appreciate irony, internet art, and niche aesthetics.

**Business model:** Customer pays → Stripe Hosted Checkout → on payment confirmation, order is automatically submitted to Printful for print + ship → customer receives order confirmation email via Resend → Printful ships directly to customer. Admin monitors everything via the built-in admin panel.

**Tagline:** "internet absurdity. wearable form."

**Domain:** y-us.store

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Prisma ORM v6) |
| Auth | Custom OIDC/PKCE with `jose` JWTs + `openid-client` |
| Payments | Stripe Hosted Checkout |
| Fulfillment | Printful API (Print-on-Demand) |
| Email | Resend (order confirmations) + SendGrid (welcome/invoice) |
| Marketing | Mailchimp (customer/order sync) |
| Media/CDN | AWS S3 + CloudFront |
| Logging | pino (structured JSON logs) |
| Validation | Zod (env + API inputs) |
| Animations | GSAP, Framer Motion, vanilla-tilt |
| Error tracking | Sentry (`@sentry/nextjs`) |
| Analytics | Google Analytics (GA4, optional) |
| i18n | next-intl (language cookie-based) |
| Package manager | **npm** — always use `--legacy-peer-deps` for installs |
| Node requirement | >=18.18.0 |

---

## Repository Structure

```
src/
├── app/                        # Next.js App Router pages + API routes
│   ├── page.tsx                # Homepage: Hero + AnimatedShapes + ProductGrid
│   ├── not-found.tsx           # Custom 404 with brand voice
│   ├── layout.tsx              # Root layout: Navbar, Footer, Providers, CookieBanner
│   ├── admin/                  # Admin panel (role-gated)
│   │   ├── layout.tsx          # Sidebar nav, Printful sync status badge, auth guard
│   │   ├── page.tsx            # Dashboard
│   │   ├── products/           # Product management + mockup selector
│   │   ├── orders/             # Orders table with status tabs + inline update
│   │   ├── inventory/          # Inventory overview
│   │   ├── cms/                # Store Settings (hero video URL, GlobalConfig)
│   │   └── permissions/        # User role management
│   │   └── actions.ts          # ALL admin server actions (products, orders, permissions)
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/       # POST: creates Stripe Hosted Checkout session
│   │   │   └── webhook/        # POST: handles checkout.session.completed
│   │   ├── printful/
│   │   │   └── webhook/        # POST: handles product_updated/deleted events → upserts DB
│   │   ├── admin/
│   │   │   ├── products/       # CRUD: GET/POST/PUT/DELETE products (Zod-validated)
│   │   │   └── orders/         # GET/PATCH orders (Zod-validated)
│   │   ├── orders/[id]/ship/   # POST: mark order shipped (admin only)
│   │   ├── reviews/            # GET approved reviews, POST new review (rate-limited)
│   │   ├── contact/            # POST contact form (rate-limited, 5/min per IP)
│   │   └── events/             # POST user event tracking (UserEvent model)
│   ├── products/
│   │   ├── page.tsx            # All products grid
│   │   └── [id]/page.tsx       # Product detail page (slug-based)
│   ├── cart/page.tsx           # Cart (localStorage-based, client)
│   ├── checkout/page.tsx       # Redirects to /cart (checkout happens on Stripe)
│   ├── success/page.tsx        # Post-purchase confirmation
│   ├── orders/                 # Customer order history + detail
│   ├── account/page.tsx        # User account page
│   ├── login|signin|signup/    # Auth pages (OIDC flow)
│   ├── contact/page.tsx        # Contact form
│   ├── feed/page.tsx           # Social feed (Instagram/TikTok/Twitter API)
│   └── [legal pages]/          # privacy-policy, terms, refund-policy, cookie-policy
├── components/
│   ├── Navbar.tsx              # Top nav with cart icon, auth links
│   ├── Footer.tsx              # Newsletter signup (→ Mailchimp via subscribeToNewsletterAction)
│   ├── HeroSection.tsx         # Hero: video background (from GlobalConfig) or static, CTA
│   ├── ProductCard.tsx         # Product card: image, title (line-clamp-2), price, CTA
│   ├── ProductDetailClient.tsx # PDP client component: variant selector, add-to-cart, reviews
│   ├── ProductGrid.tsx         # Product grid layout
│   ├── CartSidebar.tsx         # Slide-in cart sidebar
│   ├── ReviewList.tsx          # Approved reviews display
│   ├── CookieBanner.tsx        # GDPR cookie consent banner
│   ├── LanguageSwitcher.tsx    # Language toggle (sets 'language' cookie)
│   ├── CurrencySwitcher.tsx    # Currency display switcher
│   ├── NSFWBlock.tsx           # Age/content gate component
│   ├── AnimatedShapes.tsx      # GSAP-animated background shapes on homepage
│   ├── AnalyticsProvider.tsx   # GA4 provider
│   ├── AnalyticsScripts.tsx    # GA4 script injection
│   ├── PurchaseTracker.tsx     # Fires GA4 purchase event on success page
│   └── ShopClient.tsx          # Shop page client wrapper
├── lib/
│   ├── env.ts                  # Zod-validated environment variables (source of truth)
│   ├── prisma.ts               # Prisma client singleton
│   ├── logger.ts               # pino logger instance
│   ├── products.ts             # getAllProducts(), getProductBySlug() — DB queries
│   ├── assets.ts               # getAssetUrls(), assetPlaceholder() — CloudFront URL builder
│   ├── auth/
│   │   ├── session.ts          # getSessionUser(), parseSessionFromToken() — JWT session
│   │   └── adminWhitelist.ts   # isWhitelistedAdmin(email) — bootstrap admin by email
│   └── emails/
│       └── sendOrderConfirmation.ts  # Resend email: branded dark HTML order confirmation
├── server/
│   └── auth/isAdmin.ts         # isAdmin() — throws 401/403 for API route protection
├── actions/
│   ├── newsletter.ts           # subscribeToNewsletterAction → pushCustomerToMailchimp
│   └── marketing.ts            # pushOrderToMailchimp, pushCustomerToMailchimp
├── utils/
│   ├── stripe.ts               # Stripe client instance
│   ├── printful.ts             # Printful API: createPrintfulOrderForLocalOrder(), Recipient type
│   ├── printfulMockup.ts       # Printful mockup fetching utilities
│   ├── csrf.ts                 # assertCsrf() — validates CSRF token from cookie vs header
│   ├── fetchWithCsrf.ts        # fetch() wrapper that injects CSRF header
│   ├── getCsrfHeader.ts        # Gets CSRF token from cookie for client-side use
│   ├── analytics.ts            # trackEvent() utility
│   ├── ga.ts                   # GA4 event helpers
│   ├── sendgrid.ts             # SendGrid: sendWelcomeEmail(), sendInvoiceEmail()
│   ├── shipping.ts             # Shipping cost utilities
│   └── cookies.ts              # Cookie read/write utilities
└── middleware.ts               # Auth guard, admin guard, CSP headers, CSRF cookie, UTM capture
```

---

## Database Schema (PostgreSQL via Prisma)

**Migration:** `prisma/migrations/20260215215926_init_postgres/` — fresh init migration for PostgreSQL. Run `npx prisma migrate deploy` on first deploy.

### Models

**Product** — synced from Printful via webhook or `npm run sync:printful`
- `printfulProductId` (unique string) — key for Printful sync
- `slug` (unique) — used as URL param in `/products/[id]`
- `price` (Int, cents) — base/fallback price
- `images` (Json) — array of image URLs
- `deleted` (Boolean) — soft-delete, filtered from storefront

**Variant** — child of Product
- `printfulVariantId` (unique string)
- `size`, `color`
- `price` (Int, cents) — variant-level price (shown on PDP)
- `designUrls` (Json) — array of mockup URLs (front/back/left/right)
- `deleted` (Boolean)

**User**
- `sub` (unique) — OIDC subject identifier
- `role` — enum: `user` | `admin`
- `newsletterOptIn` (Boolean)

**Order**
- `stripeSessionId` (unique) — idempotency key
- `items` (Json) — `[{ productId, variantId, quantity, unitPriceCents }]`
- `totalAmount` (Int, cents)
- `status` — `pending` | `paid` | `fulfilled` | `refunded`
- `trackingNumber` (String, optional)
- `userId` (optional — supports guest checkout)

**UserEvent** — behavioral analytics events
- `event`, `entityType`, `entityId`, `metadata` (Json)
- Used by Printful webhook to log events, and by frontend analytics tracking

**ProductImage** — curated image set per product/variant
- `source` — `api` | `mockup` | `manual`
- `selected` (Boolean) — admin picks which images to show
- `sortIndex` — ordering

**PrintfulSyncLog** — records every Printful sync run
- `status` — `success` | `failed`
- Shown as badge in admin sidebar

**Review** — product reviews
- `status` — `pending` | `approved` | `rejected`
- Only `approved` reviews are served to the storefront

**GlobalConfig** — key/value store for CMS settings
- `hero_video_url` — video background for HeroSection (managed via `/admin/cms`)

---

## Auth System

Custom OIDC/PKCE implementation (no NextAuth). Flow:

1. User goes to `/login` → redirected to OIDC provider (`OIDC_ISSUER`)
2. Provider returns to `OIDC_REDIRECT_URI` with auth code
3. Code exchanged for tokens → user data stored as signed JWT in `yus_session` cookie
4. `SESSION_SECRET` signs the JWT (min 32 chars)
5. Session TTL: `SESSION_TTL_HOURS` (default 8)

**Key functions:**
- `getSessionUser()` in `src/lib/auth/session.ts` → call in server components to get current user
- `parseSessionFromToken(token)` → used in middleware to check auth without DB hit
- `isAdmin()` in `src/server/auth/isAdmin.ts` → throws in API routes if not admin
- `requireAdmin()` in `src/app/admin/actions.ts` → throws in server actions if not admin

**Admin bootstrap:** If no admin exists in DB, the first user to access `/admin` becomes admin. Email whitelist in `src/lib/auth/adminWhitelist.ts` also grants admin.

---

## E-Commerce Flow (Complete)

```
1. Customer browses products (fetched from DB, revalidate: 60s)
2. Selects variant (size/color) on PDP → adds to cart
3. Cart stored in localStorage (client-side)
4. Customer clicks "Checkout" → POST /api/stripe/checkout
   - Creates Stripe Hosted Checkout session with line items
   - Images served from CloudFront (Stripe requires public HTTPS URLs)
   - Returns { url } → customer redirected to Stripe
5. Customer pays on Stripe's domain
6. Stripe fires webhook → POST /api/stripe/webhook
   - Validates HMAC signature (timing-safe)
   - Rejects stale signatures (>5 min)
   - Idempotency check: skips if order already paid/fulfilled
   - Updates Order.status = "paid"
   - Pushes order to Mailchimp (marketing)
   - Fetches Stripe line items → sends order confirmation email via Resend
   - Submits order to Printful (createPrintfulOrderForLocalOrder)
     - Uses customer_details.address from Stripe session as Recipient
7. Printful prints and ships to customer
8. Printful fires webhook → POST /api/printful/webhook
   - product_updated/synced/created → upserts Product + Variants in DB
   - product_deleted → soft-deletes Product + Variants
9. Customer is redirected to /success page
```

**Guest checkout:** Supported — `Order.userId` is nullable. Orders linked to user if logged in.

---

## Printful Integration

**Sync script:** `npm run sync:printful` → `scripts/sync-printful.mts`
Run this to initially populate products from Printful, or after adding new products.

**Webhook (inbound from Printful):** `POST /api/printful/webhook`
- Handles: `product_updated`, `product_synced`, `product_created`, `product_deleted`, `variant_deleted`
- Validates HMAC signature with `PRINTFUL_WEBHOOK_SECRET`
- On product events: fetches variant mockups (sync variants → v2 catalog fallback) and upserts DB

**Order creation (outbound to Printful):** `createPrintfulOrderForLocalOrder(orderId, recipient)` in `src/utils/printful.ts`
- Called from Stripe webhook after payment
- Non-fatal: if it fails, order stays as `paid`, admin can retry

**Env vars needed:** `PRINTFUL_TOKEN` or `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID`, `PRINTFUL_WEBHOOK_SECRET`

---

## External Services

| Service | Purpose | Required |
|---|---|---|
| Stripe | Payments (Hosted Checkout) | Yes |
| Printful | POD fulfillment + product sync | Yes |
| Resend | Order confirmation emails | Strongly recommended |
| Mailchimp | Marketing: customer + order sync | Optional |
| AWS S3 + CloudFront | Product image CDN (Stripe requires public HTTPS image URLs) | Yes |
| SendGrid | Welcome emails, invoice emails | Optional (legacy) |
| Sentry | Error tracking | Optional |
| Google Analytics | Storefront analytics (GA4) | Optional |
| OIDC Provider | Auth (e.g. Auth0, Keycloak, or custom) | Yes |
| Algolia | Search (dep installed, not fully integrated) | Not yet active |

---

## Environment Variables

All validated by Zod in `src/lib/env.ts`. App will crash at startup if required vars are missing.

### Required (no default, app won't start without these)
```env
BASE_URL=https://yourdomain.com
NEXT_PUBLIC_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth (OIDC)
OIDC_ISSUER=https://your-oidc-provider.com
OIDC_CLIENT_ID=your_client_id
OIDC_CLIENT_SECRET=your_client_secret
OIDC_REDIRECT_URI=https://yourdomain.com/api/auth/callback
OIDC_POST_LOGOUT_REDIRECT_URI=https://yourdomain.com

SESSION_SECRET=minimum-32-character-random-string-here

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CDN (required — Stripe needs public image URLs)
CLOUDFRONT_BASE_URL=https://your-distribution.cloudfront.net
```

### Optional (features degrade gracefully if absent)
```env
# Resend (order confirmation emails — strongly recommended)
RESEND_API_KEY=re_...
RESEND_FROM=Y-US? <orders@y-us.store>

# Printful
PRINTFUL_TOKEN=your_printful_token
PRINTFUL_API_KEY=your_printful_api_key   # alias for above
PRINTFUL_STORE_ID=your_store_id
PRINTFUL_WEBHOOK_SECRET=your_webhook_secret

# AWS S3 (for image upload from admin)
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=your-bucket-name
ASSETS_BUCKET=your-assets-bucket

# Admin access
ADMIN_EMAILS=you@example.com,other@example.com   # comma-separated email whitelist

# Analytics / monitoring
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...

# Social feeds (/feed page)
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_USER_ID=...
TIKTOK_ACCESS_TOKEN=...
TIKTOK_USER_ID=...
TWITTER_BEARER_TOKEN=...
TWITTER_USER_ID=...
TWITTER_USERNAME=...

# OIDC audience (optional, for some providers)
OIDC_AUDIENCE=...

# Session tuning
SESSION_COOKIE_NAME=yus_session   # default
SESSION_TTL_HOURS=8               # default
```

---

## Deployment (Hetzner VPS — Recommended)

**Recommended setup:** Hetzner CX22 (2 vCPU, 4GB RAM, ~€4.5/mo) running:
- Nginx (reverse proxy + SSL termination)
- PM2 (Next.js process management)
- PostgreSQL (self-managed) OR Hetzner managed DB
- Future: Python/FastAPI service for ML/analytics

**One-time server setup:**
```bash
# Install Node 18+, npm, PM2, Nginx, Certbot
# Clone repo, install deps
npm install --legacy-peer-deps

# Set up .env with all required vars
# Run migrations
npx prisma migrate deploy

# Build
npm run build

# Start with PM2
pm2 start npm --name "yus-ecommerce" -- start
pm2 save && pm2 startup
```

**Nginx config (pseudo):**
```nginx
server {
  listen 443 ssl;
  server_name y-us.store;
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header X-Forwarded-Proto https;  # required for Stripe webhook check
  }
}
```

**CI/CD:** Set up GitHub Actions → SSH to server → `git pull && npm ci --legacy-peer-deps && npm run build && pm2 restart yus-ecommerce`

**After deploy (one-time):**
1. Register Stripe webhook endpoint: `https://yourdomain.com/api/stripe/webhook` → event: `checkout.session.completed`
2. Register Printful webhook: `https://yourdomain.com/api/printful/webhook`
3. Run Printful sync to populate products: `npm run sync:printful`

---

## Development

```bash
npm install --legacy-peer-deps
cp .env.example .env    # fill in required vars
npx prisma migrate dev  # run migrations
npm run dev             # starts on localhost:3000 with Turbopack
```

**Useful scripts:**
```bash
npm run sync:printful   # sync products from Printful to DB
npm run lint            # runs migration check + ESLint
npm run build           # production build (must pass before deploy)
```

---

## Established Patterns — Follow These

### Server actions (admin)
```ts
// Nested async function with 'use server' inside server components
async function action(formData: FormData) {
  'use server'
  await requireAdmin()  // from src/app/admin/actions.ts
  // ... logic
}
```

### Rate limiting (in-memory Map bucket)
```ts
// Copy the pattern from src/app/api/events/route.ts
// 5 requests/min per IP, in-memory Map
```

### Prisma JSON fields
```ts
import { Prisma } from '@prisma/client'
// Cast when writing to Json fields:
data: { items: orderItems as Prisma.InputJsonValue }
```

### Next.js 15 searchParams
```ts
// searchParams is a Promise in Next.js 15 — must await
export default async function Page({ searchParams }: { searchParams: Promise<{q?: string}> }) {
  const { q } = await searchParams
}
```

### API route protection
```ts
import { isAdmin } from '@/server/auth/isAdmin'
// Throws 401/403 automatically
await isAdmin()
```

### CSRF protection on API routes
```ts
import { assertCsrf } from '@/utils/csrf'
const csrfError = assertCsrf(req)
if (csrfError) return csrfError
```

### Client-side fetch with CSRF
```ts
import { fetchWithCsrf } from '@/utils/fetchWithCsrf'
// Automatically injects CSRF header from cookie
await fetchWithCsrf('/api/endpoint', { method: 'POST', body: JSON.stringify(data) })
```

---

## Security — What's Implemented

- **CSRF:** Double-submit cookie pattern. CSRF token set in middleware, validated in API routes via `assertCsrf()`
- **CSP headers:** `script-src 'unsafe-inline' https://js.stripe.com`, `frame-src https://js.stripe.com`, `frame-ancestors 'none'`
- **HSTS:** `max-age=63072000; includeSubDomains; preload`
- **Auth guard:** Middleware protects `/account`, `/checkout`, `/orders`, `/admin` — redirects to `/login`
- **Admin guard:** Middleware checks `session.user.role === 'admin'`; API routes call `isAdmin()`; server actions call `requireAdmin()`
- **Stripe webhook:** Custom HMAC validation (timing-safe), 5-min timestamp replay protection, idempotency check
- **Printful webhook:** HMAC timing-safe validation
- **Rate limiting:** Contact form (5/min), Reviews (5/min) — in-memory Map, resets on restart
- **Input validation:** Zod on all admin API endpoints, env schema validation at startup
- **SQL injection:** Prevented by Prisma ORM (parameterized queries)
- **XSS:** `isomorphic-dompurify` available; React escapes by default
- **Env validation:** App crashes at startup on missing/invalid required vars

---

## What's Missing / Should Be Improved

### Security (high priority)
- [ ] **Rate limiting is in-memory** — resets on every server restart, not shared across instances. Replace with Redis-backed rate limiting (e.g. Upstash Redis) for production reliability
- [ ] **No refresh token rotation** — OIDC sessions expire after `SESSION_TTL_HOURS` with no silent refresh. Users get logged out mid-session
- [ ] **Admin search endpoint** (`/admin/search`) has no implementation — the search form in admin layout submits to a route that doesn't exist
- [ ] **`SENDGRID_API_KEY` is read directly from `process.env`** (not via `env.ts`) in `src/utils/sendgrid.ts` — bypasses Zod validation
- [ ] **CSP `unsafe-inline`** is needed for Tailwind/Next.js but is a weak point — consider nonce-based CSP for script tags as Next.js supports it

### Features Missing
- [ ] **Tracking email to customer** — Printful fires a shipment webhook but the app doesn't capture `shipment_sent` events or email the tracking number to the customer. The webhook route only handles product events, not order/shipment events
- [ ] **Order history for guests** — guest checkout works but guests have no way to look up their order (no lookup-by-email flow)
- [ ] **Return/refund self-service** — refund policy page exists but there's no mechanism for customers to initiate returns
- [ ] **Stock/availability indicators** — POD means unlimited stock, but some products may be seasonal or paused. No way to mark a product as "sold out" or "limited" without deleting it
- [ ] **Social proof at launch** — Review system exists (with approval flow) but DB will be empty. Seed a few real reviews before launch
- [ ] **Sitemap.xml** — no sitemap generation for SEO
- [ ] **robots.txt** — not configured
- [ ] **Algolia search** — dependency installed but not integrated into storefront
- [ ] **Social feed** (`/feed` page) — requires Instagram/TikTok/Twitter API tokens that expire frequently

### UX / Design Improvements
- [ ] **Mobile cart** — CartSidebar needs testing on small screens for the full variant + quantity flow
- [ ] **Product filtering / sorting** — Products page shows all products with no filter by category, color, price
- [ ] **Size guide link on PDP** — SIZE_CHART constant exists in PDP but may not be prominent enough before add-to-cart
- [ ] **Return/refund trust badge on cart/PDP** — exists only in footer; high-converting stores show "30-day returns" near the CTA
- [ ] **Estimated delivery on PDP** — "Ships in 3–5 business days" copy is only shown post-purchase. Showing it on PDP reduces checkout anxiety
- [ ] **Currency conversion** — CurrencySwitcher component exists but pricing is stored in EUR cents; actual multi-currency pricing would require Stripe Price objects per currency
- [ ] **i18n is incomplete** — next-intl is set up with language cookie but translation keys are sparse; currently only `featured_tees` and a few others are translated

### Performance
- [ ] **`revalidate: 60`** on homepage — products refresh every 60s. Fine for now but consider `revalidateTag()` triggered by the Printful webhook for instant updates
- [ ] **No image optimization pipeline** — product images are served directly from CloudFront URLs without width/quality params. Use `next/image` with CloudFront as `remotePattern`

### Analytics / Future ML Roadmap
- [ ] **UserEvent model** exists and is populated by Printful webhook events but not by storefront interactions (product views, variant selections, cart adds). Wire up client-side event tracking to `POST /api/events`
- [ ] **PostHog** — strongly recommended as self-hosted analytics (session recordings, funnels, feature flags) to replace/augment GA4. Run on same Hetzner server or PostHog Cloud
- [ ] **Recommendation system** — future: use `pgvector` Postgres extension to store product embeddings; Python/FastAPI service computes recommendations based on UserEvent data. Schema already has UserEvent with metadata Json — designed for this
- [ ] **A/B testing** — once PostHog is set up, feature flags enable price/copy/layout experiments

---

## Brand Guidelines

**Colors:**
- Background: `#000000` (pure black)
- Surface: `#0f172a` (dark slate)
- Primary accent: `#39ff14` (neon green) — used for CTAs, highlights, logo
- Text primary: `#f1f5f9`
- Text muted: `#64748b`
- Border: `#1e293b`

**Typography:**
- Display/Logo: `font-pixel` (pixel/monospace style), `font-mono`, `Courier New`
- Body: system sans-serif stack
- Tailwind classes: `tracking-widest`, `uppercase`, `font-black` for impactful headings

**Voice:**
- Direct, confident, lowercase preferred for headings
- Dry humor, internet-native language
- Never corporate, never apologetic
- Examples: "your drop is confirmed.", "internet absurdity. wearable form.", "Not for everyone. Definitely for you."

**Do not:**
- Add fake urgency timers or fake stock counts (removed intentionally)
- Add fake loyalty points or rewards (removed intentionally)
- Use generic e-commerce copy ("Great choice!", "You'll love this!")
- Break the dark aesthetic with light backgrounds in new components

---

## Known Gotchas

1. **`npm install` always needs `--legacy-peer-deps`** — several deps have peer conflict with React 19
2. **Next.js 15 `searchParams` is a Promise** — `await searchParams` before destructuring in page components
3. **Stripe webhook requires `X-Forwarded-Proto: https`** — make sure your reverse proxy (Nginx) sets this header; without it, the webhook returns 400
4. **Prisma JSON fields need explicit cast** — `as Prisma.InputJsonValue` when writing, TypeScript will complain otherwise
5. **`CLOUDFRONT_BASE_URL` is required** — Stripe Hosted Checkout validates image URLs; they must be public HTTPS. Local `localhost` URLs will fail Stripe's image validation
6. **Admin email whitelist** — if you change the server and lose your admin session, add your email to `ADMIN_EMAILS` env var to regain access
7. **Printful sync script** must be run manually after first deploy to populate products — the DB starts empty
8. **`console.error` vs `logger.error`** — use `logger` from `@/lib/logger` (pino) everywhere in server code, not `console.*`
