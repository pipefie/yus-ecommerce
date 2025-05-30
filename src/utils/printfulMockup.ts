// src/utils/printfulMockup.ts

const PF_BASE  = "https://api.printful.com";
const PF_KEY   = process.env.PRINTFUL_API_KEY!;
const PF_STORE = process.env.PRINTFUL_STORE_ID!;

const headers = {
  Authorization: `Bearer ${PF_KEY}`,
  "Content-Type": "application/json",
  "X-PF-Store-Id": PF_STORE,
};

/** 1) List available mockup options & groups for a product */
export async function fetchMockupStyles(productId: number): Promise<{
  options: string[];
  option_groups: string[];
}> {
  const res = await fetch(
    `${PF_BASE}/mockup-generator/printfiles/${productId}`,
    { headers }
  );
  if (!res.ok) throw new Error(`Fetch styles failed: ${res.status}`);
  const { result } = await res.json();
  return {
    options: result.options,
    option_groups: result.option_groups,
  };
}

/** 2) Create a mockup task for Flat + Front & Back */
export async function createFlatFrontBackMockupTask(
  productId:   number,
  variantIds:  number[],
  frontImgUrl: string,
  backImgUrl:  string
): Promise<string> {
  const body = {
    variant_ids:   variantIds,
    format:        "png",
    option_groups: ["Flat"],          // your “flotante” style
    options:       ["Front", "Back"], // both placements
    files: [
      {
        placement: "front",
        image_url: frontImgUrl,
        position: {
          area_width:  1800,
          area_height: 2400,
          width:       1800,
          height:      1800,
          top:         300,
          left:        0,
        },
      },
      {
        placement: "back",
        image_url: backImgUrl,
        position: {
          area_width:  1800,
          area_height: 2400,
          width:       1800,
          height:      1800,
          top:         300,
          left:        0,
        },
      },
    ],
  };

  const res = await fetch(
    `${PF_BASE}/mockup-generator/create-task/${productId}`,
    { method: "POST", headers, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Create task failed: ${res.status} ${JSON.stringify(err)}`);
  }
  const { result } = await res.json();
  return result.task_key;
}

/** 3) Poll until your mockups are ready */
export async function pollMockupTask(
  taskKey: string,
  intervalMs = 2000,
  timeoutMs  = 60000
): Promise<Array<{
  placement:   string;
  mockup_url:  string;
  variant_ids: number[];
}>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${PF_BASE}/mockup-generator/task?task_key=${taskKey}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
    const { result } = await res.json();
    if (result.status === "completed") {
      return result.mockups;
    } else if (result.status === "failed") {
      throw new Error(`Mockup failed: ${result.error || "unknown"}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Mockup polling timed out");
}
