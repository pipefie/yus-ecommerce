
const BASE_URL = "https://api.printful.com";
const TOKEN = process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_TOKEN || "";

async function safeRequest<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printful ${path} → ${res.status}\n${text}`);
  }
  return (await res.json()) as T;
}

export interface CatalogProduct {
  id: number;
  name?: string;
  image?: string;
  [key: string]: unknown;
}

export interface CatalogResponse {
  result: CatalogProduct[];
  paging?: { total?: number };
}

export interface GetProductResponse {
  result?: {
    sync_product?: Record<string, unknown>;
    product?: Record<string, unknown>;
    sync_variants?: Record<string, unknown>[];
    variants?: Record<string, unknown>[];
  };
}

export async function fetchCatalogPage(
  offset = 0,
  limit = 100
): Promise<CatalogResponse> {
  const { result, paging } = await safeRequest<CatalogResponse>(
    `/store/products?offset=${offset}&limit=${limit}`
  );
  return { result, paging };
}

export async function getProduct(
  productId: string | number
): Promise<GetProductResponse["result"]> {
  const { result } = await safeRequest<GetProductResponse>(
    `/store/products/${productId}`
  );
  return result;
}

export { safeRequest };