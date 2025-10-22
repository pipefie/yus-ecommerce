import { env } from "@/lib/env";

const baseUrl = env.CLOUDFRONT_BASE_URL.replace(/\/+$/, "");
const baseHost = (() => {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "";
  }
})();

const PLACEHOLDER = "/placeholder.png";

export function getAssetUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.hostname === baseHost ? value : null;
    } catch {
      return null;
    }
  }
  const key = value.replace(/^\/+/, "");
  if (!key) return null;
  return `${baseUrl}/${key}`;
}

export function getAssetUrls(values: Array<string | null | undefined>, options?: { fallback?: string; }): string[] {
  const out = values
    .map((value) => getAssetUrl(value))
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  if (out.length) return Array.from(new Set(out));
  return options?.fallback ? [options.fallback] : [];
}

export function assetPlaceholder(): string {
  return PLACEHOLDER;
}

export function getCdnHostname(): string {
  return baseHost;
}
