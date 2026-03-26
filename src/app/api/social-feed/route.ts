import { NextResponse } from "next/server";
import { fetchSocialFeed } from "@/lib/socialFeed";

export async function GET() {
  const feed = await fetchSocialFeed();
  return NextResponse.json({ feed });
}
