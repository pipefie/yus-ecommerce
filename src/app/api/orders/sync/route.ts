import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import  logger  from '@/lib/logger'
import fetch from 'node-fetch'
import { getRequestLogger } from '@/lib/logger'

interface ShippoTrack {
  tracking_status?: {
    status?: string
  }
}

function isShippoTrack(obj: any): obj is ShippoTrack {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (
      obj.tracking_status === undefined ||
      (
        typeof obj.tracking_status === "object" &&
        (
          obj.tracking_status.status === undefined ||
          typeof obj.tracking_status.status === "string"
        )
      )
    )
  );
}


export async function POST(req: NextRequest) {
  const logger = getRequestLogger(req)
  const unknownData = await req.json();
  if (!isShippoTrack(unknownData)) {
    logger.error("Invalid ShippoTrack payload")
    return NextResponse.json({ error: "Invalid ShippoTrack payload" }, { status: 400 })
  }
  const data: ShippoTrack = unknownData;
  const orders = await prisma.order.findMany({ where: { trackingNumber: { not: null } } })
  for (const order of orders) {
    try {
      const res = await fetch(`https://api.goshippo.com/tracks/shippo/${order.trackingNumber}`)
      if (!res.ok) continue
      const trackData: ShippoTrack = unknownData;
      await prisma.order.update({ where: { id: order.id }, data: { status: trackData.tracking_status?.status } })
      // TODO: adjust inventory levels based on order items
    } catch (err) {
      logger.error(err as Error, 'Track update failed')
    }
  }
  return NextResponse.json({ ok: true })
}