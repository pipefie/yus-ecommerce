This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Mandatory Environment Variables

Before starting the app, create a `.env.local` file in the project root with at least the following variables:

```
DATABASE_URL=file:./prisma/prisma/dev.db
STRIPE_SECRET_KEY=your-stripe-key
NEXT_PUBLIC_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/db
```

Then run the Prisma migrations to initialize the local database:

```bash
npx prisma migrate dev
```

## Migrating from SQLite to Postgres

Older versions of this project used SQLite. To migrate existing data to Postgres:

1. Set `DATABASE_URL` to your Postgres connection string.
2. Generate a migration script comparing the old SQLite database to Postgres:

   ```bash
   npx prisma migrate diff \
     --from-url "file:./prisma/prisma/dev.db" \
     --to-url "$DATABASE_URL" \
     --script > migration.sql
   ```

3. Apply the generated SQL to your Postgres database:

   ```bash
   psql "$DATABASE_URL" -f migration.sql
   ```

4. Run the standard Prisma migrate command to ensure the schema is up to date:

   ```bash
   npx prisma migrate dev
   ```

## Environment Variables

Copy `.env.example` to `.env.local` and provide values for all variables. At a minimum you will need API keys for Stripe, an OIDC client, and storage credentials.

```
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_URL=http://localhost:3000
BASE_URL=http://localhost:3000
OIDC_ISSUER=https://your-idp/.well-known/openid-configuration
OIDC_CLIENT_ID=oidc-client-id
OIDC_CLIENT_SECRET=oidc-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
OIDC_AUDIENCE=
SESSION_SECRET=replace-with-64-char-random
SESSION_TTL_HOURS=8
CLOUDFRONT_BASE_URL=https://cdn.example.com
ASSETS_BUCKET=yus-mockups
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
PRINTFUL_API_KEY=printful-api-key
PRINTFUL_STORE_ID=printful-store-id
PRINTFUL_WEBHOOK_SECRET=printful-webhook-secret
PRINTFUL_SYNC_KEY=your-sync-secret
DEFAULT_CURRENCY=EUR
ADMIN_EMAILS=founder@example.com
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM=from@example.com
SENDGRID_WELCOME_TEMPLATE=template-id
MAILCHIMP_API_KEY=your-mailchimp-key
MAILCHIMP_LIST_ID=list-id
MAILCHIMP_STORE_ID=store-id
NEXT_PUBLIC_GA_ID=ga-id
NEXT_PUBLIC_SENTRY_DSN=sentry-client-dsn
SENTRY_DSN=sentry-server-dsn
NEXT_PUBLIC_ALGOLIA_APP_ID=algolia-app-id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=algolia-search-key
DATABASE_URL=file:./prisma/dev.db
```

### Printful Sync

- Run a manual sync from **Admin → Dashboard → Printful Sync**. The button invokes the same backend job and records the outcome so everyone can see when the catalog last updated.
- Automate it with `POST /api/admin/printful/sync` by using either an authenticated admin session or a `Bearer ${PRINTFUL_SYNC_KEY}` header (ideal for cron jobs).
- `GET /api/printful-sync` remains available for local testing and accepts `?clear=1` to wipe cached assets first.

Each run creates a `PrintfulSyncLog` row. After pulling these changes run `npx prisma migrate dev` to add the new table before triggering a sync.

### Admin bootstrap

- Set `ADMIN_EMAILS` to a comma-separated list (e.g. `founder@example.com,ops@example.com`). Any matching OIDC user is promoted to admin on login even if other admins already exist, so you always have a back door into `/admin` without touching the database manually.

### Migration sanity check

Run `npm run check:migrations` (automatically part of `npm run lint`) to ensure every folder under `prisma/migrations` still contains its `migration.sql`. This prevents corrupted or half-deleted migrations from sneaking into the repo and breaking `prisma migrate`.

The `dbConnect` helper logs connection failures to the console so you can debug issues with your MongoDB configuration.

## OIDC Setup

1. Register a confidential OIDC client (Auth0, Keycloak, authentik, etc.) and enable the authorization code + PKCE flow.
2. Set the redirect URI to `http://localhost:3000/auth/callback` and the post-logout redirect URI to `http://localhost:3000/`.
3. Grant the client access to the `openid profile email` scopes to receive `sub`, `email`, `name`, and `picture` claims.
4. Populate the OIDC and session variables in `.env.local`, then run your Prisma migrations to sync the schema.
5. Seed at least one user with the `admin` role to access the admin console.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Analytics

Google Analytics 4 is loaded only after the user accepts cookies. Ecommerce events (`view_item`, `add_to_cart`, `purchase`) are dispatched via `window.gtag` once consent is granted.

### User events

Lightweight analytics events are queued in the browser and sent to `/api/events` when the page loses visibility. Events include a random session identifier and optional user id; IP addresses are not stored. Collection only begins after the user accepts the cookie banner so no tracking occurs without consent. Avoid sending personally identifiable information in the `metadata` field to keep records anonymized.

## Cookies and Session Security

On first visit the site displays a banner requesting cookie consent. Tracking scripts are loaded only after consent is given. Any UTM parameters present in the landing URL are persisted in cookies (e.g. `utm_source`, `utm_medium`, `utm_campaign`) for 30 days so later signups and purchases can be attributed to the original campaign.

Authentication sessions rely on HTTP-only cookies that include the `Secure` flag in production and `SameSite=Lax` to mitigate CSRF. Tokens are rotated on sign‑in and cleared on logout to reduce the risk of session fixation.


## Error monitoring

The project uses the Sentry SDK for both client and server error tracking. Provide `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` environment variables to enable reporting.

## Request logging

Cloudflare Workers can forward request logs to [Logflare](https://logflare.app/) for long term storage and dashboards. Point your Worker at the Logflare endpoint and include your source token.

## Rate limiting

Stripe API requests automatically retry up to two times with a 10-second timeout to handle transient errors and avoid hitting rate limits.

## CI / Backups

The `ci.yml` workflow runs linting, tests and `npm run build` on every push. A Node script `scripts/backup-db.ts` saves `prisma/prisma/dev.db` to the `backups` folder with a timestamp so the SQLite database can be backed up in CI or a cron job.

## Testing

Run unit tests with Jest:

```bash
npm test
```

To run Cypress end-to-end tests, build the app and then start the test runner:

```bash
npm run build
npm run e2e
```

## Localization

The `LanguageSwitcher` component allows users to change the interface language. Their choice is persisted by the `LanguageContext` in both a `language` cookie and `localStorage` so the preference sticks on reloads.

## Email and Marketing Integration

Set the following environment variables to enable email and marketing features:

```
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM=from@example.com
SENDGRID_WELCOME_TEMPLATE=template-id
MAILCHIMP_API_KEY=your-mailchimp-key
MAILCHIMP_LIST_ID=list-id
MAILCHIMP_STORE_ID=store-id
```

The `/api/email/welcome` endpoint sends a welcome email after signup.
The `/api/email/invoice` endpoint generates a PDF invoice and emails it to the customer.
Signups and completed orders are pushed to Mailchimp for marketing automation.

## Security

The application sets various HTTP headers in `middleware.ts` to mitigate common
web attacks:

- `Content-Security-Policy` restricts which domains can serve content.
- `X-Frame-Options: DENY` blocks rendering in iframes.
- `Strict-Transport-Security` forces HTTPS for future requests.
- `Referrer-Policy: strict-origin-when-cross-origin` limits referrer details.
- `X-Content-Type-Options: nosniff` prevents MIME type sniffing.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` disables these
  features unless explicitly allowed.
