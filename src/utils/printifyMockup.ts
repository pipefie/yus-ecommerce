// src/utils/printifyMockup.ts

const BASE    = "https://api.printify.com/v1";
const TOKEN   = process.env.PRINTIFY_API_KEY!;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID!;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type":  "application/json",
};

// 1) Create mockup task on Printify
export async function createPrintifyMockup(
  productId:   number,
  variantId:   number,
  frontImg:    string,
  backImg?:    string
): Promise<number> {
  const body = {
    product_id:   productId,
    variant_ids:  [variantId],
    mockup_views: ["front", "back"],
    images:       {
      front: frontImg,
      ...(backImg ? { back: backImg } : {}),
    },
  };
  const res = await fetch(
    `${BASE}/shops/${SHOP_ID}/mockups.json`,
    { method: "POST", headers, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Printify mockup error: ${res.status} ${JSON.stringify(err)}`);
  }
  const json = await res.json();
  return json.data.id;  // mockup task id
}

// 2) Poll until ready
export async function pollPrintifyMockup(
  mockupId: number,
  interval = 2000,
  timeout  = 60000
): Promise<{ front: string; back?: string }> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${BASE}/shops/${SHOP_ID}/mockups/${mockupId}.json`,
      { headers }
    );
    if (!res.ok) throw new Error(`Poll error: ${res.status}`);
    const { data } = await res.json();
    if (data.status === "completed") {
      return {
        front: data.urls.front,
        back:  data.urls.back,
      };
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("Mockup polling timed out");
}
