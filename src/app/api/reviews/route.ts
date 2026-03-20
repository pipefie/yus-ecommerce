import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const WINDOW_MS = 60 * 1000
const MAX_POSTS = 5
const buckets = new Map<string, { count: number; reset: number }>()

function allowed(key: string) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  if (bucket.count >= MAX_POSTS) return false
  bucket.count++
  return true
}

const ReviewSchema = z.object({
  productId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
  author: z.string().min(1).max(100),
  comment: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  const id = parseInt(productId);
  if (isNaN(id)) {
    return NextResponse.json([], { status: 200 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId: id, status: "approved" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  if (!allowed(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = ReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 })
  }

  const { productId, author, comment, rating } = parsed.data

  try {
    const review = await prisma.review.create({
      data: { productId, author, comment, rating, status: "pending" },
    });
    return NextResponse.json({ id: review.id, status: review.status });
  } catch {
    return NextResponse.json({ error: "Failed to post review" }, { status: 500 });
  }
}
