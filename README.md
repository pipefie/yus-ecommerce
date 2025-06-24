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

## Error monitoring

The project uses the Sentry SDK for both client and server error tracking. Provide `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` environment variables to enable reporting.

## Request logging

Cloudflare Workers can forward request logs to [Logflare](https://logflare.app/) for long term storage and dashboards. Point your Worker at the Logflare endpoint and include your source token.

## CI / Backups

The `ci.yml` workflow runs linting, tests and `npm run build` on every push. A Node script `scripts/backup-db.ts` saves `prisma/prisma/dev.db` to the `backups` folder with a timestamp so the SQLite database can be backed up in CI or a cron job.

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
