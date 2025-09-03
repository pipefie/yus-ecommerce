// next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';


const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    minimumCacheTTL: 60,
    // Whitelist Printful image hosts
    remotePatterns: [
      { protocol: "https", hostname: "files.cdn.printful.com", pathname: "/**" },
      { protocol: "https", hostname: "img.printful.com", pathname: "/**" },
      // Allow Printify mockup images
      { protocol: "https", hostname: "images-api.printify.com", pathname: "/**" },
    ],
  },

  experimental: {

    optimizePackageImports: ["react-icons"],
  },
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
