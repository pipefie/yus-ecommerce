// next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';


const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    minimumCacheTTL: 60,
    // Whitelist Printify’s mockup host
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images-api.printify.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.printify.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  experimental: {

    optimizePackageImports: ["react-icons"],
  },
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
