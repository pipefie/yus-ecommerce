import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  BASE_URL: z.string().trim().url(),

  OIDC_ISSUER: z.string().trim().url(),
  OIDC_CLIENT_ID: z.string().trim().min(1),
  OIDC_CLIENT_SECRET: z.string().trim().min(1),
  OIDC_REDIRECT_URI: z.string().trim().url(),
  OIDC_POST_LOGOUT_REDIRECT_URI: z.string().trim().url(),
  OIDC_AUDIENCE: z.string().trim().optional(),

  SESSION_SECRET: z.string().trim().min(32),
  SESSION_COOKIE_NAME: z.string().trim().default("yus_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(8),

  DATABASE_URL: z.string().trim().min(1),

  STRIPE_SECRET_KEY: z.string().trim().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(1),
  NEXT_PUBLIC_URL: z.string().trim().url(),

  CLOUDFRONT_BASE_URL: z.string().trim().url(),
  ASSETS_BUCKET: z.string().trim().optional(),
  S3_BUCKET: z.string().trim().optional(),

  AWS_REGION: z.string().trim().optional(),
  AWS_ACCESS_KEY_ID: z.string().trim().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().trim().optional(),

  NEXT_PUBLIC_GA_ID: z.string().trim().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().trim().optional(),
  SENTRY_DSN: z.string().trim().optional(),

  ADMIN_EMAILS: z.string().trim().optional(),

  PRINTFUL_API_KEY: z.string().trim().optional(),
  PRINTFUL_TOKEN: z.string().trim().optional(),
  PRINTFUL_STORE_ID: z.string().trim().optional(),
  PRINTFUL_WEBHOOK_SECRET: z.string().trim().optional(),

  INSTAGRAM_ACCESS_TOKEN: z.string().trim().optional(),
  INSTAGRAM_USER_ID: z.string().trim().optional(),
  TIKTOK_ACCESS_TOKEN: z.string().trim().optional(),
  TIKTOK_USER_ID: z.string().trim().optional(),
  TWITTER_BEARER_TOKEN: z.string().trim().optional(),
  TWITTER_USER_ID: z.string().trim().optional(),
  TWITTER_USERNAME: z.string().trim().optional(),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,

  BASE_URL: process.env.BASE_URL,

  OIDC_ISSUER: process.env.OIDC_ISSUER,
  OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET,
  OIDC_REDIRECT_URI: process.env.OIDC_REDIRECT_URI,
  OIDC_POST_LOGOUT_REDIRECT_URI: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
  OIDC_AUDIENCE: process.env.OIDC_AUDIENCE,

  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_TTL_HOURS: process.env.SESSION_TTL_HOURS,

  DATABASE_URL: process.env.DATABASE_URL,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,

  CLOUDFRONT_BASE_URL:
    process.env.CLOUDFRONT_BASE_URL ?? process.env.CF_PUBLIC_URL,
  ASSETS_BUCKET: process.env.ASSETS_BUCKET,
  S3_BUCKET: process.env.S3_BUCKET,

  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,

  PRINTFUL_API_KEY: process.env.PRINTFUL_API_KEY,
  PRINTFUL_TOKEN: process.env.PRINTFUL_TOKEN,
  PRINTFUL_STORE_ID: process.env.PRINTFUL_STORE_ID,
  PRINTFUL_WEBHOOK_SECRET: process.env.PRINTFUL_WEBHOOK_SECRET,

  INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_USER_ID: process.env.INSTAGRAM_USER_ID,
  TIKTOK_ACCESS_TOKEN: process.env.TIKTOK_ACCESS_TOKEN,
  TIKTOK_USER_ID: process.env.TIKTOK_USER_ID,
  TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
  TWITTER_USER_ID: process.env.TWITTER_USER_ID,
  TWITTER_USERNAME: process.env.TWITTER_USERNAME,
});

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
