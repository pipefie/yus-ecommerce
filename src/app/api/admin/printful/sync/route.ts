import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { runPrintfulSync } from "@/server/printful/sync";

async function authorize(req: NextRequest): Promise<string | undefined> {
  const header = req.headers.get("authorization");
  const syncKey = process.env.PRINTFUL_SYNC_KEY;
  if (syncKey && header === `Bearer ${syncKey}`) {
    return "automation";
  }
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user.email ?? user.sub ?? "admin";
}

export async function POST(req: NextRequest) {
  try {
    const actor = await authorize(req);
    const body = await req.json().catch(() => ({}));
    const clear = Boolean(body?.clear);
    const result = await runPrintfulSync({
      clear,
      actor,
      source: "admin-api",
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
