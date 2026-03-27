# Y-US? — CLAUDE.md

Complete context for AI-assisted development. Read this before making any changes.

---

## What This Project Is

**Y-US?** is a print-on-demand e-commerce store selling graphic apparel. A premium absurdist streetwear brand blending minimal design with chaotic internet culture — intentionally weird, dark, and unfiltered but premium-feeling. Products are designed in-house and printed/fulfilled via Printful (POD model, zero inventory). Payments via Stripe. The brand targets Gen-Z/millennial online culture consumers who appreciate irony, internet art, and niche aesthetics.

**Business model:** Customer pays → Stripe Hosted Checkout → on payment confirmation, order is automatically submitted to Printful for print + ship → customer and admin receive email notifications → Printful ships directly to customer → when Printful ships, order auto-marks as `fulfilled` and customer receives tracking email.

**Tagline:** "internet absurdity. wearable form."

**Domain:** y-us.store

---

## Brand Identity

This section is the authoritative brand reference. All new UI, copy, and design must conform to it.

### Brand Concept

**Name:** Y-US? — a rhetorical, confrontational question mark. The name is an absurdist challenge: "why us?" with no satisfying answer.

**Positioning:** Anti-corporate, anti-generic, anti-urgency-gimmicks. Internet absurdity made wearable. The brand refuses fake scarcity timers, loyalty points, and generic e-commerce copy. Everything should feel like it was made by someone deeply online.

**Audience:** People who get the joke. Online culture natives who collect irony like other people collect sneakers.

### Logo

- **File:** `/public/logoWhite.png`
- **Rendered:** 70×70px in Navbar (Next.js `<Image>`, `opacity-90 transition hover:opacity-100`)
- **Usage rule:** White logo on black background only. Never invert to black-on-white. Never colorize. Never resize beyond context — the pixel aesthetic depends on its dimensions.
- **Font treatment for brand name text:** "Press Start 2P" (pixel/arcade font) — whenever "Y-US?" appears as text (not the logo image), use this font.

### Color Palette

| Role | Value | Tailwind / CSS | When to use |
|---|---|---|---|
| **Neon green** | `#39ff14` | `.text-neon`, `.border-neon`, `text-[#39ff14]`, `--color-neon` | Logo accents, CTA highlights, order numbers, active states. This is THE brand color. |
| **Black** | `#000000` / `#0a0a0a` | `bg-black` | All backgrounds — storefront, pages, emails. Never use white or light backgrounds anywhere. |
| **Slate surface** | `#0f172a` | `bg-slate-900` | Cards, panels, admin surfaces |
| **Border** | `#1e293b` | `border-slate-800` | All borders |
| **Primary text** | `#f1f5f9` | `text-slate-100` | Main text |
| **Muted text** | `#64748b` | `text-slate-500` | Captions, labels |
| **Emerald (interactive)** | `emerald-300/400` | `text-emerald-300`, `bg-emerald-400/90` | Hover states, buttons, cart badge, newsletter CTA. Different role from neon green — emerald is for interaction, neon is for brand identity. |
| **Selection** | — | `selection:bg-emerald-400 selection:text-black` | Text selection highlight (set globally) |

**Rule:** Never introduce any new color that isn't on this list without an explicit instruction. No pastels, no whites, no light grays as backgrounds.

### Typography

**Display / Logo font:**
- Family: **"Press Start 2P"** (retro pixel/arcade)
- Loaded in `src/app/globals.css` via `@import` as CSS var `--font-pixel`
- Tailwind class: `.font-pixel`
- Used for: hero "Y-US?" heading, 404 heading, success page heading, footer brand name
- **Never replace this with any other font for brand name or hero heading.**

**Body / UI font:**
- System sans-serif: Arial, Helvetica, sans-serif
- Geist Sans/Mono available via Tailwind (`--font-geist-sans`, `--font-geist-mono`)

**Typography rules:**
- Headings: `uppercase`, `tracking-[0.4em]` or `tracking-widest`, `font-black` for impact
- Brand headings: lowercase preferred ("your drop is confirmed.", not "Your Drop Is Confirmed.")
- Monospace for order IDs, tracking numbers, code: `font-mono`

### Animation System

These animations are working, intentional, and brand-defining. **Do not remove or "improve" them.**

| Animation | Where | How |
|---|---|---|
| **Glitch** | `HeroSection.tsx` — "Y-US?" heading | CSS keyframe `glitch` in `globals.css` using `clip: rect()` and `transform: translate()`. Class: `animate-[glitch_2s_infinite]`. This is the brand's signature animation. |
| **GSAP Parallax scroll** | `HeroSection.tsx` | `gsap.to()` + `ScrollTrigger`. Hero content moves up 150px on scroll. `ease: "none"`, `scrub: true`. |
| **Rotating SVG ring** | `HeroSection.tsx` — decorative | Quechua-style circular ring. `.animate-spin-slow` (10s linear infinite). Color: `stroke-neon/50`. |
| **Framer Motion floating shapes** | `AnimatedShapes.tsx` | 3 circular spheres in `bg-neon/20`, sizes 60/80/120px. Motion: `y: [0,-20,0]`, opacity: `[0.6,0.2,0.6]`, 8s easeInOut, staggered delays 0/1/2s. Positioned behind hero content. |
| **Product card hover** | `ProductCard.tsx` | Image: `group-hover:scale-105`. Card lift: `group-hover:-translate-y-1`. Border: `hover:border-emerald-400/60`. |
| **Mobile menu** | `Navbar.tsx` | Full-screen `bg-black/95` overlay. `translate-y` transition 500ms. `+` icon open, `X` icon close. |

### Tagline System

| Context | Copy |
|---|---|
| Hero subtitle | "internet absurdity. wearable form." |
| Meta description | "Nothing's Off-Limits" |
| Post-purchase | "your drop is confirmed." / "We're printing your order now." |
| PDP | "Not for everyone. Definitely for you." |
| 404 | "you got lost." / "this page doesn't exist. neither does work-life balance. keep moving." |
| Footer description | "Minimal design meets unfiltered chaos. Crafted in limited batches." |
| Newsletter success | "you're on the list." |
| CTA links | "back to the drop" / "Shop Now" |

### Voice Rules

- Lowercase for headings and brand copy. Not sentence case — literally lowercase.
- Dry, deadpan humor. The joke is never explained.
- Internet-native language. References online culture without being cringe about it.
- Never corporate. Never apologetic. No "We're sorry for the inconvenience."
- No fake enthusiasm. No exclamation points used to manufacture energy.
- No: "Great choice!", "You'll love this!", "Limited time offer!", "Only 3 left!"

---

## CRITICAL — Do Not Break

These elements are working correctly and are core to the brand or system integrity. **Never modify, remove, or "improve" them without an explicit instruction from the user.**

```
BRAND IDENTITY (storefront)
1.  Glitch animation on "Y-US?" heading — HeroSection.tsx (CSS keyframe in globals.css)
2.  GSAP parallax scroll — HeroSection.tsx (gsap + ScrollTrigger)
3.  Rotating SVG ring — HeroSection.tsx (.animate-spin-slow)
4.  AnimatedShapes floating spheres — AnimatedShapes.tsx (Framer Motion)
5.  Neon green (#39ff14) as the primary accent — never swap for another green
6.  Press Start 2P pixel font for logo/display text
7.  Pure black (#000/#0a0a0a) backgrounds — never introduce light backgrounds
8.  CartSidebar slide-in behavior and localStorage cart state
9.  Dark HTML email templates — sendOrderConfirmation.ts, sendAdminOrderNotification.ts

SECURITY & INFRASTRUCTURE
10. Stripe webhook HMAC validation + 5-min timestamp replay protection + idempotency check
11. Printful webhook HMAC validation (timing-safe crypto.timingSafeEqual)
12. OIDC auth flow — do not modify session.ts, middleware auth guards, or PKCE flow without extreme care
13. Admin guard chain: middleware role check → isAdmin() in API routes → requireAdmin() in server actions
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Prisma ORM v6) |
| Auth | Custom OIDC/PKCE with `jose` JWTs + `openid-client` (Auth0 as provider) |
| Payments | Stripe Hosted Checkout |
| Fulfillment | Printful API (Print-on-Demand) |
| Email | Resend (order confirmation + tracking + admin alerts) + SendGrid (welcome/invoice, legacy) |
| Marketing | Mailchimp (customer/order sync) |
| Media/CDN | AWS S3 + CloudFront |
| Containerization | Docker (node:22-slim multi-stage build) |
| CI/CD | GitHub Actions → SSH deploy to Hetzner |
| Logging | pino (structured JSON logs) |
| Validation | Zod (env + API inputs) |
| Animations | GSAP + ScrollTrigger, Framer Motion, CSS keyframes |
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
│   ├── globals.css             # CSS vars (--color-neon, --font-pixel), keyframes (glitch, spin-slow)
│   ├── admin/                  # Admin panel (role-gated)
│   │   ├── layout.tsx          # Sidebar nav, Printful sync status badge, auth guard
│   │   ├── page.tsx            # Dashboard (revenue metrics, sync logs, top products)
│   │   ├── products/           # Product management + mockup selector
│   │   ├── orders/
│   │   │   ├── page.tsx        # Orders table: status tabs, inline update, "View →" links
│   │   │   └── [id]/page.tsx   # Full order detail: customer, shipping, items, Printful, tracking
│   │   ├── inventory/          # Inventory overview
│   │   ├── cms/                # Store Settings (hero video URL, GlobalConfig)
│   │   └── permissions/        # User role management
│   │   └── actions.ts          # ALL admin server actions (products, orders, permissions)
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/       # POST: creates Stripe Hosted Checkout session
│   │   │   └── webhook/        # POST: handles checkout.session.completed — persists customer data, submits to Printful, sends emails
│   │   ├── printful/
│   │   │   └── webhook/        # POST: product events + package_shipped + order_failed
│   │   ├── admin/
│   │   │   ├── products/       # CRUD: GET/POST/PUT/DELETE products (Zod-validated)
│   │   │   └── orders/         # GET/PATCH orders (Zod-validated)
│   │   ├── orders/[id]/ship/   # POST: mark order shipped (admin only)
│   │   ├── reviews/            # GET approved reviews, POST new review (rate-limited)
│   │   ├── contact/            # POST contact form (rate-limited, 5/min per IP)
│   │   └── events/             # POST user event tracking (UserEvent model)
│   ├── products/
│   │   ├── page.tsx            # All products grid
│   │   └── [id]/page.tsx       # Product detail page (slug-based, schema.org JSON-LD)
│   ├── orders/
│   │   ├── page.tsx            # Customer order history
│   │   └── [id]/page.tsx       # Customer order detail: status, items with enriched data, tracking
│   ├── cart/page.tsx           # Cart (localStorage-based, client)
│   ├── checkout/page.tsx       # Redirects to /cart (checkout happens on Stripe)
│   ├── success/page.tsx        # Post-purchase confirmation ("Your drop is in production.")
│   ├── account/page.tsx        # User account page
│   ├── login|signin|signup/    # Auth pages (OIDC flow)
│   ├── contact/page.tsx        # Contact form
│   ├── feed/page.tsx           # Social feed (Instagram/TikTok/Twitter API)
│   └── [legal pages]/          # privacy-policy, terms, refund-policy, cookie-policy
├── components/
│   ├── Navbar.tsx              # Fixed top nav: logo (logoWhite.png), cart icon+badge, auth dropdown, mobile menu
│   ├── Footer.tsx              # Newsletter signup (→ Mailchimp), brand tagline, social links
│   ├── HeroSection.tsx         # Hero: full-screen video, GSAP parallax, glitch "Y-US?", rotating ring
│   ├── AnimatedShapes.tsx      # Framer Motion: 3 floating neon spheres (background decoration)
│   ├── ProductCard.tsx         # Card: dark bg, hover lift+scale+border, line-clamp-2 title
│   ├── ProductGrid.tsx         # Responsive product grid layout
│   ├── ProductDetailClient.tsx # PDP client: variant selector, multi-image gallery, add-to-cart, reviews
│   ├── CartSidebar.tsx         # Slide-in cart sidebar (localStorage-based)
│   ├── ReviewList.tsx          # Approved reviews display
│   ├── CookieBanner.tsx        # GDPR cookie consent banner
│   ├── LanguageSwitcher.tsx    # Language toggle (sets 'language' cookie)
│   ├── CurrencySwitcher.tsx    # Currency display switcher
│   ├── NSFWBlock.tsx           # Age/content gate component
│   ├── AnalyticsProvider.tsx   # GA4 provider
│   ├── AnalyticsScripts.tsx    # GA4 script injection
│   ├── PurchaseTracker.tsx     # Fires GA4 purchase event on success page
│   ├── ShopClient.tsx          # Shop page client wrapper
│   └── admin/
│       └── ConfirmButton.tsx   # Client component: shows window.confirm() before destructive form submit
├── lib/
│   ├── env.ts                  # Zod-validated environment variables — source of truth for all env vars
│   ├── prisma.ts               # Prisma client singleton
│   ├── logger.ts               # pino logger instance (use this, never console.*)
│   ├── products.ts             # getAllProducts(), getProductBySlug() — DB queries
│   ├── assets.ts               # getAssetUrls(), assetPlaceholder() — CloudFront URL builder
│   ├── auth/
│   │   ├── session.ts          # getSessionUser(), parseSessionFromToken() — JWT session
│   │   └── adminWhitelist.ts   # isWhitelistedAdmin(email) — bootstrap admin by email
│   └── emails/
│       ├── sendOrderConfirmation.ts  # sendOrderConfirmation() + sendTrackingEmail() — dark HTML, via Resend
│       └── sendAdminOrderNotification.ts  # sendAdminOrderNotification() — sends to all ADMIN_EMAILS
├── server/
│   └── auth/isAdmin.ts         # isAdmin() — throws 401/403 for API route protection
├── actions/
│   ├── newsletter.ts           # subscribeToNewsletterAction → pushCustomerToMailchimp
│   └── marketing.ts            # pushOrderToMailchimp, pushCustomerToMailchimp
├── utils/
│   ├── stripe.ts               # Stripe client instance
│   ├── printful.ts             # createPrintfulOrderForLocalOrder(orderId, recipient) → { printfulOrderId }
│   ├── printfulMockup.ts       # Printful mockup fetching utilities
│   ├── csrf.ts                 # assertCsrf() — validates CSRF token from cookie vs header
│   ├── fetchWithCsrf.ts        # fetch() wrapper that injects CSRF header
│   ├── getCsrfHeader.ts        # Gets CSRF token from cookie for client-side use
│   ├── analytics.ts            # trackEvent() utility
│   ├── ga.ts                   # GA4 event helpers
│   ├── sendgrid.ts             # sendWelcomeEmail(), sendInvoiceEmail() — uses env.SENDGRID_API_KEY
│   ├── shipping.ts             # Shipping cost utilities
│   └── cookies.ts              # Cookie read/write utilities
├── middleware.ts               # Auth guard, admin guard, CSP headers, CSRF cookie, UTM capture
└── .github/workflows/
    └── deploy.yml              # GitHub Actions: type-check → SSH → docker compose build+up → prune
```

---

## Database Schema (PostgreSQL via Prisma)

**Latest migration:** `20260327105638_add_order_customer_fields`

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
- `currency` (String) — e.g. `"eur"`
- `status` — `pending` | `paid` | `fulfilled` | `refunded`
- `trackingNumber` (String?) — set by Printful webhook or admin manually
- `userId` (optional — supports guest checkout)
- `customerEmail` (String?) — persisted from Stripe session at payment time
- `customerName` (String?) — persisted from Stripe session at payment time
- `shippingAddress` (Json?) — `{ line1, line2, city, state, country, zip }` from Stripe
- `printfulOrderId` (String?) — Printful's order ID, stored after submission

**UserEvent** — behavioral analytics events
- `event`, `entityType`, `entityId`, `metadata` (Json)
- Populated by Printful webhook (audit trail) and can be wired to frontend event tracking

**ProductImage** — curated image set per product/variant
- `source` — `api` | `mockup` | `manual`
- `selected` (Boolean) — admin picks which images to show
- `sortIndex` — ordering
- `placement` — `front` | `back` | `left` | `right`

**PrintfulSyncLog** — records every Printful sync run
- `status` — `success` | `failed`
- Shown as status badge in admin sidebar

**Review** — product reviews
- `status` — `pending` | `approved` | `rejected`
- Only `approved` reviews are served to the storefront

**GlobalConfig** — key/value store for CMS settings
- `hero_video_url` — video background for HeroSection (managed via `/admin/cms`)

---

## Auth System

Custom OIDC/PKCE implementation (no NextAuth). Auth0 is the current OIDC provider. Flow:

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
2. Selects variant (size/color) on PDP → adds to cart (localStorage)
3. Customer clicks "Checkout" → POST /api/stripe/checkout
   - Creates Stripe Hosted Checkout session with line items
   - Images served from CloudFront (Stripe requires public HTTPS URLs)
   - Returns { url } → customer redirected to Stripe
4. Customer pays on Stripe's domain
5. Stripe fires webhook → POST /api/stripe/webhook
   - Validates HMAC signature (timing-safe) + 5-min replay protection
   - Idempotency check: skips if order already paid/fulfilled
   - Updates Order: status = "paid", customerEmail, customerName, shippingAddress
   - Pushes order to Mailchimp (marketing)
   - Sends order confirmation email to customer (Resend)
   - Sends admin notification email to all ADMIN_EMAILS (Resend)
   - Submits order to Printful (createPrintfulOrderForLocalOrder, confirm: true)
     - Uses customer_details.address from Stripe session as Recipient
     - Stores returned printfulOrderId on Order
6. Printful prints and ships to customer (automatic, no manual step)
7. Printful fires webhook → POST /api/printful/webhook
   - product_updated/synced/created → upserts Product + Variants in DB
   - product_deleted → soft-deletes Product + Variants
   - package_shipped → marks Order.status = "fulfilled", stores trackingNumber,
                        sends tracking email to customer (if customerEmail set)
   - order_failed → logs error, sends admin alert email
8. Customer redirected to /success page after Stripe payment
9. Customer can view order at /orders/[id] (auth required)
   - Shows status, items with product/variant details, tracking number if available
```

**Guest checkout:** Supported — `Order.userId` is nullable. Orders linked to user if logged in.

**Returns/cancellations:** Manual only. Printful policy: 30-day window for defective/damaged reprints. Admin sets status to `refunded` and issues Stripe refund from Stripe dashboard. No automated self-service flow.

---

## Printful Integration

**Sync script:** `npm run sync:printful` → `scripts/sync-printful.mts`
Run after first deploy to populate products, or after adding new products in Printful.

**Webhook (inbound from Printful):** `POST /api/printful/webhook`
- Validates HMAC signature with `PRINTFUL_WEBHOOK_SECRET` (timing-safe)
- Handles: `product_updated`, `product_synced`, `product_created`, `product_deleted`, `variant_deleted`, `package_shipped`, `order_failed`
- On product events: fetches variant mockups and upserts DB
- On `package_shipped`: updates order to `fulfilled`, stores tracking, sends customer email
- On `order_failed`: logs error, sends admin notification

**Webhook registration (API-only — no GUI in Printful dashboard):**
```bash
curl -X POST https://api.printful.com/webhooks \
  -H "Authorization: Bearer $PRINTFUL_API_KEY" \
  -H "X-PF-Store-Id: $PRINTFUL_STORE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://y-us.store/api/printful/webhook",
    "types": ["package_shipped","order_failed","product_synced","product_updated","product_deleted"]
  }'
```
Copy the `signing_secret` from the response → set as `PRINTFUL_WEBHOOK_SECRET` in `.env`.

**Order creation (outbound to Printful):** `createPrintfulOrderForLocalOrder(orderId, recipient)` in `src/utils/printful.ts`
- Returns `{ printfulOrderId }` — stored on Order for traceability
- Called from Stripe webhook after payment, with `confirm: true` (goes straight to Printful production queue)
- Non-fatal: if it fails, order stays as `paid`. Admin can retry via "Re-submit to Printful" button on order detail page.

---

## Email System

All emails use **Resend**. All templates use dark HTML (black background, neon/emerald accents). All silently skip if `RESEND_API_KEY` is not set.

| Function | File | Trigger | Recipient |
|---|---|---|---|
| `sendOrderConfirmation()` | `src/lib/emails/sendOrderConfirmation.ts` | Stripe webhook, order paid | Customer |
| `sendTrackingEmail()` | `src/lib/emails/sendOrderConfirmation.ts` | Printful `package_shipped` webhook | Customer |
| `sendAdminOrderNotification()` | `src/lib/emails/sendAdminOrderNotification.ts` | Stripe webhook, order paid | All `ADMIN_EMAILS` (comma-separated) |

`RESEND_FROM` default: `Y-US? <orders@y-us.store>`

---

## Admin Panel

All admin routes are at `/admin/*`. Protected by middleware role check + `requireAdmin()` in server actions.

| Route | Purpose |
|---|---|
| `/admin` | Dashboard: revenue, sync logs, top products |
| `/admin/orders` | Orders table with status filter tabs, inline status update, "View →" link per row |
| `/admin/orders/[id]` | Full order detail: customer info, shipping address, enriched items table, Printful panel (order ID + resubmit), tracking panel (number + manual form) |
| `/admin/products` | Product catalog, search, edit, create |
| `/admin/products/[id]` | Product editor: details, variants, mockup gallery (drag-and-drop reorder) |
| `/admin/inventory` | Variant stock and price overview |
| `/admin/cms` | CMS: hero video URL (stored in GlobalConfig) |
| `/admin/permissions` | User role management |

**Key admin server actions** (all in `src/app/admin/actions.ts`):
- `updateOrderStatusAction(orderId, status)` — validates status enum, revalidates list + detail
- `updateTrackingNumberAction(formData)` — manual tracking number update
- `resubmitToPrintfulAction(formData)` — rebuilds Recipient from stored shippingAddress, re-calls Printful, stores new printfulOrderId
- `triggerPrintfulSyncAction(formData)` — runs sync (append or replace mode)
- `createProductAction()` — creates draft product, redirects to editor

---

## External Services

| Service | Purpose | Required |
|---|---|---|
| Stripe | Payments (Hosted Checkout) | Yes |
| Printful | POD fulfillment + product sync | Yes |
| Resend | All transactional emails (order, tracking, admin alert) | Strongly recommended |
| Mailchimp | Marketing: customer + order sync | Optional |
| AWS S3 + CloudFront | Product image CDN (Stripe requires public HTTPS image URLs) | Yes |
| SendGrid | Welcome emails, invoice emails (legacy) | Optional |
| Sentry | Error tracking | Optional |
| Google Analytics | Storefront analytics (GA4) | Optional |
| Auth0 | OIDC provider | Yes |
| Algolia | Search (dep installed, not integrated) | Not yet active |

---

## Environment Variables

All validated by Zod in `src/lib/env.ts`. App will crash at startup if required vars are missing.

### Required (app will not start without these)
```env
BASE_URL=https://y-us.store
NEXT_PUBLIC_URL=https://y-us.store
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth (OIDC / Auth0)
OIDC_ISSUER=https://your-tenant.eu.auth0.com/
OIDC_CLIENT_ID=your_client_id
OIDC_CLIENT_SECRET=your_client_secret
OIDC_REDIRECT_URI=https://y-us.store/api/auth/callback
OIDC_POST_LOGOUT_REDIRECT_URI=https://y-us.store/

# Generate with: openssl rand -hex 32
SESSION_SECRET=minimum-32-character-random-string-here

# Stripe
STRIPE_SECRET_KEY=sk_live_...   # sk_test_* for testing only, will not process real payments
STRIPE_WEBHOOK_SECRET=whsec_...

# CDN (required — Stripe validates image URLs must be public HTTPS)
CLOUDFRONT_BASE_URL=https://your-distribution.cloudfront.net
```

### Optional (features degrade gracefully if absent)
```env
# Resend (emails — strongly recommended, all 3 email types will silently skip without this)
RESEND_API_KEY=re_...
RESEND_FROM=Y-US? <orders@y-us.store>

# Admin emails (comma-separated — required for admin notification emails)
ADMIN_EMAILS=you@example.com,other@example.com

# Printful (required for POD fulfillment and product sync)
PRINTFUL_API_KEY=your_printful_token
PRINTFUL_STORE_ID=your_store_id
PRINTFUL_WEBHOOK_SECRET=from_printful_webhook_registration_response   # NOT a value you invent

# AWS S3 (for image upload from admin — no spaces in values)
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=AKIAT...
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your-bucket-name

# OIDC audience (optional — only if Auth0 API uses one; leave blank/omit if not needed)
OIDC_AUDIENCE=

# Session tuning
SESSION_COOKIE_NAME=yus_session   # default
SESSION_TTL_HOURS=8               # default

# Analytics / monitoring
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...

# SendGrid (legacy welcome/invoice emails)
SENDGRID_API_KEY=SG...
SENDGRID_FROM=Y-US? <noreply@y-us.store>

# Social feeds (/feed page — tokens expire frequently)
INSTAGRAM_ACCESS_TOKEN=...
TIKTOK_ACCESS_TOKEN=...
TWITTER_BEARER_TOKEN=...
```

### Common .env mistakes (check before deploy)
- AWS values must have **no leading space** after `=` — `AWS_ACCESS_KEY_ID= value` (with space) WILL fail
- `OIDC_AUDIENCE` must not have an inline comment — `OIDC_AUDIENCE= # optional` includes the comment as the value. Use `OIDC_AUDIENCE=` (empty)
- `PRINTFUL_WEBHOOK_SECRET` must be the `signing_secret` from the Printful webhook registration API response — not an invented string
- `SESSION_SECRET` must be a real 32+ char random string — generate with `openssl rand -hex 32`
- `BASE_URL` and `NEXT_PUBLIC_URL` must be the production domain, not `http://localhost:3000`
- `OIDC_REDIRECT_URI` must be the production callback URL, not localhost
- Stale vars to remove from `.env`: `PRINTIFY_API_KEY`, `MONGO_URI`, `NEXTAUTH_URL`, `AUTH0_SECRET`, `AUTH0_BASE_URL`, `JWT_SECRET` — these are from removed integrations

---

## Deployment (Hetzner VPS + Docker)

**Recommended setup:** Hetzner CX22 (2 vCPU, 4GB RAM, ~€4.5/mo):
- Nginx (reverse proxy + SSL termination via Certbot)
- Docker + Docker Compose (containerized Next.js)
- PostgreSQL (self-managed or Render managed DB)

**Dockerfile:** Multi-stage build (deps → builder → runner)
- Base image: `node:22-slim` with `apt-get upgrade -y` for security patches
- Non-root user: `nodejs` (UID 1001)
- Output mode: `standalone` (set in `next.config.ts`)

**GitHub Actions CI/CD** (`.github/workflows/deploy.yml`):
1. Push to `master` → triggers workflow
2. Install deps (`npm ci --legacy-peer-deps`)
3. Type-check gate: `npx tsc --noEmit` — must pass before deploy
4. SSH to Hetzner: `git pull` → `docker compose -f docker-compose.prod.yml build web` → `up -d --no-deps web` → `docker image prune -f`

**Nginx config (required for Stripe webhooks):**
```nginx
server {
  listen 443 ssl;
  server_name y-us.store;
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header X-Forwarded-Proto https;  # REQUIRED — Stripe webhook check fails without this
    proxy_set_header Host $host;
  }
}
```

**One-time post-deploy setup:**
1. Run DB migrations: `docker compose exec web npx prisma migrate deploy`
2. Register Stripe webhook: `https://y-us.store/api/stripe/webhook` → event: `checkout.session.completed`
3. Register Printful webhook via API (see Printful Integration section above)
4. Sync products: `npm run sync:printful` (or use admin "Sync" button)
5. Update Auth0 callback URLs to production domain in Auth0 tenant dashboard

---

## Development

```bash
npm install --legacy-peer-deps
# Create .env.local for local DB (do not use production DB locally)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yus
npx prisma migrate dev   # run migrations
npm run dev              # starts on localhost:3000 with Turbopack
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
// Top-level exported action in src/app/admin/actions.ts
export async function myAction(formData: FormData) {
  'use server'   // at file level (the file has 'use server' at top)
  await requireAdmin()
  // ... logic
}

// OR nested inline action inside a server component (for page-specific actions)
async function action(formData: FormData) {
  'use server'
  await updateOrderStatusAction(orderId, status)
}
```

### Destructive action confirmation
```tsx
// Use ConfirmButton from src/components/admin/ConfirmButton.tsx
import ConfirmButton from '@/components/admin/ConfirmButton'
<form action={dangerousAction}>
  <ConfirmButton message="This will delete everything. Are you sure?">
    Delete All
  </ConfirmButton>
</form>
```

### Rate limiting (in-memory Map bucket)
```ts
// Copy pattern from src/app/api/events/route.ts
// 5 requests/min per IP — in-memory Map (resets on restart)
```

### Prisma JSON fields
```ts
import { Prisma } from '@prisma/client'
// Cast when writing to Json fields:
data: { items: orderItems as Prisma.InputJsonValue }
```

### Next.js 15 searchParams / params
```ts
// Both searchParams and params are Promises in Next.js 15 — must await
export default async function Page({ searchParams }: { searchParams: Promise<{q?: string}> }) {
  const { q } = await searchParams
}
```

### API route protection
```ts
import { isAdmin } from '@/server/auth/isAdmin'
await isAdmin()  // throws 401/403 automatically
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
await fetchWithCsrf('/api/endpoint', { method: 'POST', body: JSON.stringify(data) })
```

### Logging
```ts
import logger from '@/lib/logger'
logger.info({ orderId }, 'Order created')
logger.error({ err, orderId }, 'Failed to submit to Printful')
// Never use console.log / console.error in server code
```

---

## Security — What's Implemented

- **CSRF:** Double-submit cookie pattern. Token set in middleware, validated in API routes via `assertCsrf()`
- **CSP headers:** `script-src 'unsafe-inline' https://js.stripe.com`, `frame-src https://js.stripe.com`, `frame-ancestors 'none'`
- **HSTS:** `max-age=63072000; includeSubDomains; preload`
- **Auth guard:** Middleware protects `/account`, `/checkout`, `/orders`, `/admin` — redirects to `/login`
- **Admin guard:** Middleware checks `session.user.role === 'admin'`; API routes call `isAdmin()`; server actions call `requireAdmin()`
- **Stripe webhook:** Custom HMAC validation (timing-safe), 5-min timestamp replay protection, idempotency check
- **Printful webhook:** HMAC timing-safe validation (`crypto.timingSafeEqual`)
- **Rate limiting:** Contact form (5/min), Reviews (5/min) — in-memory Map, resets on restart
- **Input validation:** Zod on all admin API endpoints, env schema validation at startup
- **SQL injection:** Prevented by Prisma ORM (parameterized queries)
- **XSS:** `isomorphic-dompurify` available; React escapes by default
- **Env validation:** App crashes at startup on missing/invalid required vars
- **SendGrid:** Uses `env.SENDGRID_API_KEY` via Zod-validated env (no direct `process.env` bypass)

---

## What's Missing / Should Be Improved

### Security (high priority)
- [ ] **Rate limiting is in-memory** — resets on every server restart, not shared across instances. Replace with Redis-backed rate limiting (e.g. Upstash Redis) for production reliability
- [ ] **No refresh token rotation** — OIDC sessions expire after `SESSION_TTL_HOURS` with no silent refresh. Users get logged out mid-session
- [ ] **Admin search endpoint** (`/admin/search`) — search form in admin layout submits to a route that has no implementation
- [ ] **CSP `unsafe-inline`** is needed for Tailwind/Next.js but is a weak point — consider nonce-based CSP for script tags

### Features Missing
- [ ] **Order history for guests** — guest checkout works but guests have no way to look up their order (no lookup-by-email flow)
- [ ] **Return/refund self-service** — refund policy page exists but customers cannot initiate returns themselves
- [ ] **Stock/availability indicators** — no way to mark a product as "sold out" or "limited" without soft-deleting it
- [ ] **Social proof at launch** — Review system exists with approval flow but DB is empty. Seed real reviews before launch.
- [ ] **Sitemap.xml** — route file exists (`/sitemap.xml`), verify it generates correctly with all product slugs
- [ ] **Algolia search** — dependency installed but not integrated into storefront search
- [ ] **Social feed** (`/feed` page) — Instagram/TikTok/Twitter API tokens expire frequently, making this fragile

### UX / Design
- [ ] **Mobile cart** — CartSidebar needs testing on small screens for the full variant + quantity flow
- [ ] **Product filtering / sorting** — Products page shows all products with no filter by category, color, price
- [ ] **Estimated delivery on PDP** — "Ships in 3–5 business days" is only shown post-purchase; showing it on PDP reduces checkout anxiety
- [ ] **Currency conversion** — CurrencySwitcher exists but pricing is stored in EUR cents; actual multi-currency requires Stripe Price objects per currency
- [ ] **i18n incomplete** — next-intl is set up but translation keys are sparse (only `featured_tees` and a few others)

### Performance
- [ ] **`revalidate: 60` on homepage** — consider `revalidateTag()` triggered by Printful webhook for instant product updates
- [ ] **No image optimization params** — product images served from CloudFront without width/quality params; use `next/image` with sized CloudFront URLs

### Analytics / Future ML Roadmap
- [ ] **UserEvent model** is populated by webhook events but not by storefront interactions (product views, cart adds). Wire frontend tracking to `POST /api/events`
- [ ] **PostHog** — recommended for session recordings, funnels, feature flags. Self-host on same Hetzner server or use PostHog Cloud
- [ ] **Recommendation system** — future: `pgvector` Postgres extension + Python/FastAPI service computing recommendations from UserEvent data
- [ ] **A/B testing** — once PostHog is set up, feature flags enable price/copy/layout experiments

### Pre-Deploy Checklist
- [ ] Clean stale `.env` vars: remove `PRINTIFY_API_KEY`, `MONGO_URI`, `NEXTAUTH_URL`, `AUTH0_SECRET`, `JWT_SECRET`
- [ ] Set `PRINTFUL_WEBHOOK_SECRET` from actual Printful webhook registration response (not a placeholder)
- [ ] Generate real `SESSION_SECRET` with `openssl rand -hex 32`
- [ ] Set `BASE_URL`, `NEXT_PUBLIC_URL`, `OIDC_REDIRECT_URI`, `OIDC_POST_LOGOUT_REDIRECT_URI` to production domain
- [ ] Use live Stripe key (`sk_live_*`), not test key
- [ ] Fix AWS env var leading spaces

---

## Known Gotchas

1. **`npm install` always needs `--legacy-peer-deps`** — several deps have peer conflict with React 19
2. **Next.js 15 `searchParams` and `params` are Promises** — always `await` before destructuring in page components
3. **Stripe webhook requires `X-Forwarded-Proto: https`** — Nginx must set this header; without it, the webhook signature check returns 400
4. **Prisma JSON fields need explicit cast** — `as Prisma.InputJsonValue` when writing, TypeScript will complain otherwise
5. **`CLOUDFRONT_BASE_URL` is required** — Stripe Hosted Checkout validates image URLs; they must be public HTTPS. Local `localhost` URLs will fail Stripe's image validation
6. **Admin email whitelist** — if you lose your admin session, add your email to `ADMIN_EMAILS` env var to regain access
7. **Printful sync must be run manually after first deploy** — the DB starts empty; run `npm run sync:printful` or use admin "Sync" button
8. **Always use `logger` from `@/lib/logger`** — never `console.*` in server code
9. **Printful webhook registration is API-only** — there is no GUI for this in the Printful dashboard. Use `POST https://api.printful.com/webhooks`. The `signing_secret` in the response IS the `PRINTFUL_WEBHOOK_SECRET`.
10. **`.env` leading spaces in values** — `AWS_ACCESS_KEY_ID= value` (note the space) WILL cause AWS auth to fail. No space after `=`.
11. **`OIDC_AUDIENCE` inline comments** — `OIDC_AUDIENCE= # optional` includes the comment as the literal value in most parsers. Use `OIDC_AUDIENCE=` (empty value) or omit the line entirely.
12. **Stripe test vs live keys** — `sk_test_*` will not process real payments. Use `sk_live_*` in production and update the webhook secret accordingly.
13. **`output: 'standalone'`** in `next.config.ts` must be typed as `'standalone' as const` — otherwise TypeScript infers `string` and rejects it.
