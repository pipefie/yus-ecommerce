// next.config.ts
import type { NextConfig } from "next";

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

export default nextConfig;
