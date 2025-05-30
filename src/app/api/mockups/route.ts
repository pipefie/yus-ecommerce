// src/app/api/mockups/route.ts
import { NextResponse } from "next/server";
import {
  createFlatFrontBackMockupTask,
  pollMockupTask,
} from "@/utils/printfulMockup";

export async function POST(req: Request) {
  const { productId, variantIds, frontImgUrl, backImgUrl } = await req.json();

  // 1) kick off the mockup task
  const taskKey = await createFlatFrontBackMockupTask(
    productId,
    variantIds,
    frontImgUrl,
    backImgUrl
  );

  // 2) wait for it to finish
  const mockups = await pollMockupTask(taskKey);

  // 3) return exactly the URLs for “Flat + Front/Back”
  return NextResponse.json({ mockups });
}
