import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fetch from 'node-fetch'
import { getRequestLogger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const logger = getRequestLogger(req)
  const orders = await prisma.order.findMany({ where: { trackingNumber: { not: null } } })
  for (const order of orders) {
    try {
      const res = await fetch(`https://api.goshippo.com/tracks/shippo/${order.trackingNumber}`)
      if (!res.ok) continue
      const data = await res.json()
      await prisma.order.update({ where: { id: order.id }, data: { status: data.tracking_status?.status } })
      // TODO: adjust inventory levels based on order items
    } catch (err) {
      logger.error('Track update failed', err)
    }
  }
  return NextResponse.json({ ok: true })
}