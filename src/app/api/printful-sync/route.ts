import { NextResponse } from "next/server"
import { runPrintfulSync } from "@/server/printful/sync"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const shouldClear = url.searchParams.get('clear') === '1' || url.searchParams.get('clear') === 'true'

    const result = await runPrintfulSync({ clear: shouldClear, source: "public-get" })
    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error("printful-sync error", err)
    const message = err instanceof Error ? err.message : "Unknown error"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
