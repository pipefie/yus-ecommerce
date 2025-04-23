// src/app/api/printful/mockup/[action]/[id]/route.ts
import { NextResponse } from "next/server"
import { BASE, KEY } from "@/utils/printful"

export async function GET(
  req: Request,
  { params: { action, id } }: { params: { action: string; id: string } }
) {
  const res = await fetch(`${BASE}/mockup-generator/${action}/${id}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  })
  const { result } = await res.json()
  return NextResponse.json(result)
}

export async function POST(
  req: Request,
  { params: { id } }: { params: { id: string } }
) {
  const { printfile_id, template_id, image_url } = await req.json()
  const res = await fetch(`${BASE}/mockup-generator/create-task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      variant_ids: [Number(id)],
      format: "png",
      print_file: { id: printfile_id, image_url },
      template: { id: template_id },
    }),
  })
  const { result } = await res.json()
  return NextResponse.json({ task_id: result.task_id })
}
