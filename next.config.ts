import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Allow Printful's image CDN and other domains
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'files.printful.com',
        },],
      domains: [
        "files.printful.com",     // Printful mockups
        "example.com",            // Your own domain (if used)
      ],
      minimumCacheTTL: 60,        // Cache optimized images for 60s
    },
  
    // Improve bundle size (optional but recommended)
    experimental: {
      optimizePackageImports: ["react-icons"], // If you use icons
    },
  
    // Enable React Strict Mode (for debugging)
    reactStrictMode: true,
};

export default nextConfig;
