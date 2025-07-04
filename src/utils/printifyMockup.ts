// src/utils/printifyMockup.ts
const BASE  = "https://api.printify.com/v1";
const TOKEN = process.env.PRINTIFY_API_KEY!;

interface PrintifyMockupPayload {
  product_id: number
  variant_ids: number[]
  images: { src: string; placement: "front" | "back" }[]
}

async function call(path: string, opts: RequestInit = {}) {
  console.log(`[PrintifyMockup] ➤ ${opts.method || "GET"} ${path}`, opts.body);
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type":  "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  console.log(`[PrintifyMockup] ← ${path}`, res.status, json);
  if (!res.ok) throw new Error(`Mockup ${path} error ${res.status}: ${text}`);
  return json;
}

export async function createPrintifyMockup(
  productId: number,
  variantId: number,
  frontUrl: string,
  backUrl?: string
): Promise<string> {
  const payload: PrintifyMockupPayload  = {
    product_id:   productId,
    variant_ids: [variantId],
    images:       [{ src: frontUrl, placement: "front" }],
  };
  if (backUrl) payload.images.push({ src: backUrl, placement: "back" });
  const { id } = await call("/mockups.json", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return id;
}

export async function pollPrintifyMockup(
  taskId: string
): Promise<{ front?: string; back?: string }> {
  for (let i = 0; i < 8; i++) {
    const json = (await call(`/mockups/${taskId}.json`)) as {
      status: string
      files: { placement: string; src: string }[]
    };
    if (json.status === "completed") {
      const out: { front?: string; back?: string } = {};
      for (const f of json.files) {
        if (f.placement === "front") out.front = f.src;
        if (f.placement === "back")  out.back  = f.src;
      }
      return out;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.warn(`[PrintifyMockup] poll timeout for ${taskId}`);
  return {};
}
