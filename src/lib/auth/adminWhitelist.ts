import { env } from "@/lib/env";

const list = env.ADMIN_EMAILS
  ? env.ADMIN_EMAILS.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
  : [];

export const adminWhitelist = new Set(list);

export function isWhitelistedAdmin(email?: string | null | undefined): boolean {
  if (!email) return false;
  return adminWhitelist.has(email.toLowerCase());
}
