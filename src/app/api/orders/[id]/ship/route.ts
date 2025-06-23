import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getShippingRates, purchaseLabel, Address, Parcel } from '@/utils/shipping'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { from, to, parcel }: { from: Address; to: Address; parcel: Parcel } = await req.json()
  const rates = await getShippingRates(from, to, parcel)
  const best = rates.rates?.[0]
  if (!best) return NextResponse.json({ error: 'No rates found' }, { status: 400 })
  const label = await purchaseLabel(best.object_id)
  await prisma.order.update({ where: { id: Number(params.id) }, data: { trackingNumber: label.tracking_number } })
  return NextResponse.json({ trackingNumber: label.tracking_number })
}