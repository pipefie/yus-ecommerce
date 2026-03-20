import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/env";
import logger from "@/lib/logger";

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 5
const buckets = new Map<string, { count: number; reset: number }>()

function allowed(key: string) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  if (bucket.count >= MAX_REQUESTS) return false
  bucket.count++
  return true
}

// Initialize Resend with API key if available, otherwise skip sending
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  if (!allowed(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const { name, email, topic, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ success: true });
    }

    await resend.emails.send({
      from: "Y-US? Store <onboarding@resend.dev>",
      to: ["hi@y-us.shop"],
      replyTo: email,
      subject: `[${String(topic || "general").toUpperCase()}] New message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Contact form error");
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
