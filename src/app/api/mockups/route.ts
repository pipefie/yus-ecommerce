// src/app/api/mockups/route.ts
import { NextResponse } from "next/server";

const BASE   = "https://api.printify.com/v1";
const TOKEN  = process.env.PRINTIFY_API_KEY!;
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type":  "application/json",
};

/**
 * Printify mockup docs:
 * POST /mockups.json
 * GET  /mockups/{mockup_id}.json
 */
export default async function handler(req: Request) {
  const { variantId, frontImgUrl, backImgUrl } = await req.json();

  // 1) create mockup
  const createRes = await fetch(`${BASE}/mockups.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      variant_id:   variantId,
      scale:        1,
      images: [
        { placement: "front", image_url: frontImgUrl },
        { placement: "back",  image_url: backImgUrl  },
      ],
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    return NextResponse.json({ error: err }, { status: 500 });
  }
  const { id: mockupId } = await createRes.json();

  // 2) fetch the result
  const pollRes = await fetch(`${BASE}/mockups/${mockupId}.json`, { headers });
  if (!pollRes.ok) {
    const err = await pollRes.json().catch(() => ({}));
    return NextResponse.json({ error: err }, { status: 500 });
  }
  const { preview_url } = await pollRes.json();

  return NextResponse.json({ preview_url });
}
