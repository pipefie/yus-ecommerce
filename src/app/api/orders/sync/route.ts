import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequestLogger } from '@/lib/logger'

interface ShippoTrackStatus {
  status?: string
}

interface ShippoTrack {
  tracking_status?: ShippoTrackStatus
}

function isShippoTrack(input: unknown): input is ShippoTrack {
  if (typeof input !== 'object' || input === null) return false
  const candidate = input as ShippoTrack
  if (candidate.tracking_status === undefined) return true
  if (typeof candidate.tracking_status !== 'object' || candidate.tracking_status === null) return false
  return candidate.tracking_status.status === undefined || typeof candidate.tracking_status.status === 'string'
}

export async function POST(req: NextRequest) {
  const logger = getRequestLogger(req)
  const payload = await req.json()
  if (!isShippoTrack(payload)) {
    logger.error({ payload }, 'Invalid Shippo payload')
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const orders = await prisma.order.findMany({ where: { trackingNumber: { not: null } } })

  for (const order of orders) {
    if (!order.trackingNumber) continue
    try {
      const response = await fetch(`https://api.goshippo.com/tracks/shippo/${order.trackingNumber}`)
      if (!response.ok) continue
      const trackData = (await response.json()) as unknown
      if (!isShippoTrack(trackData)) continue
      await prisma.order.update({
        where: { id: order.id },
        data: { status: trackData.tracking_status?.status ?? order.status },
      })
    } catch (error) {
      logger.error({ error, orderId: order.id }, 'Failed to update tracking status')
    }
  }

  return NextResponse.json({ ok: true })
}
