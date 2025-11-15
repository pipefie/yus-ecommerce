// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

type RemotePattern = {
  protocol: "https" | "http";
  hostname: string;
  pathname: string;
};

const remotePatterns: RemotePattern[] = [];
const cloudfrontBase = process.env.CLOUDFRONT_BASE_URL ?? process.env.CF_PUBLIC_URL;
if (cloudfrontBase) {
  try {
    const source = cloudfrontBase.startsWith("http") ? cloudfrontBase : `https://${cloudfrontBase}`;
    const { hostname, protocol } = new URL(source);
    remotePatterns.push({ protocol: protocol.replace(':', '') as RemotePattern["protocol"], hostname, pathname: '/**' });
  } catch {
    // ignore invalid URL
  }
}

remotePatterns.push(
  { protocol: "https", hostname: "files.cdn.printful.com", pathname: "/**" },
  { protocol: "https", hostname: "cdn.printful.com", pathname: "/**" },
  { protocol: "https", hostname: "images.printful.com", pathname: "/**" },
);

const nextConfig = {
  reactStrictMode: true,
  images: {
    minimumCacheTTL: 60,
    remotePatterns,
  },
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
