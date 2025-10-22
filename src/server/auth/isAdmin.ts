// src/server/auth/isAdmin.ts
import { getSessionUser } from "@/lib/auth/session";

export async function isAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.role === "admin";
}
