import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

type OrderPageParams = Promise<{ id: string }>

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting payment',
  paid: 'Confirmed — being printed',
  fulfilled: 'Shipped',
  refunded: 'Refunded',
}

export default async function OrderDetail({ params }: { params: OrderPageParams }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect(`/login?returnTo=/orders/${id}`)

  const dbUser = await prisma.user.findUnique({ where: { sub: user.sub }, select: { id: true } })
  if (!dbUser) redirect(`/login?returnTo=/orders/${id}`)

  const order = await prisma.order.findFirst({ where: { id: Number(id), userId: dbUser.id } })
  if (!order) notFound()

  // Enrich items
  type RawItem = { variantId?: number; productId?: number; quantity?: number; unitPriceCents?: number }
  const rawItems: RawItem[] = Array.isArray(order.items) ? (order.items as RawItem[]) : []
  const enrichedItems = await Promise.all(
    rawItems.map(async (item) => {
      const variant = item.variantId
        ? await prisma.variant.findUnique({
            where: { id: Number(item.variantId) },
            include: { product: { select: { title: true, imageUrl: true, slug: true } } },
          })
        : null
      return { ...item, variant }
    })
  )

  const total = `${order.currency.toUpperCase()} ${(order.totalAmount / 100).toFixed(2)}`
  const statusLabel = STATUS_LABEL[order.status] ?? order.status

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4">

        {/* Header */}
        <div className="mb-8">
          <Link href="/orders" className="text-sm text-slate-500 transition hover:text-slate-300">
            ← My orders
          </Link>
          <h1 className="mt-4 text-3xl font-black text-slate-100">
            Order <span className="text-[#39ff14]">#{order.id}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {order.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Status */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-1 text-base font-semibold text-slate-100 capitalize">{statusLabel}</p>
          {order.status === 'paid' && (
            <p className="mt-1 text-xs text-slate-400">
              We&apos;re printing your order. Dispatch in 3–5 business days.
            </p>
          )}
          {order.status === 'fulfilled' && order.trackingNumber && (
            <div className="mt-2">
              <p className="text-xs text-slate-500">Tracking number</p>
              <p className="font-mono text-sm font-semibold text-[#39ff14]">{order.trackingNumber}</p>
            </div>
          )}
          {order.status === 'fulfilled' && !order.trackingNumber && (
            <p className="mt-1 text-xs text-slate-400">Your order has shipped. Tracking info coming shortly.</p>
          )}
        </div>

        {/* Items */}
        {enrichedItems.length > 0 && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Items</p>
            <div className="space-y-4">
              {enrichedItems.map((item, i) => {
                const unitCents = Number(item.unitPriceCents) || 0
                const qty = Number(item.quantity) || 1
                return (
                  <div key={i} className="flex items-center gap-3">
                    {item.variant?.product?.imageUrl ? (
                      <Image
                        src={item.variant.product.imageUrl}
                        alt={item.variant.product.title ?? ''}
                        width={52}
                        height={52}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-13 w-13 rounded-lg bg-slate-800" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">
                        {item.variant?.product?.title ?? `Item #${i + 1}`}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-slate-500">
                          {[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-200">
                        {order.currency.toUpperCase()} {((unitCents * qty) / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">× {qty}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 border-t border-slate-800 pt-3 flex justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500">Total</span>
              <span className="font-bold text-slate-100">{total}</span>
            </div>
          </div>
        )}

        {/* Support */}
        <p className="text-center text-xs text-slate-600">
          Questions about your order?{' '}
          <a href="mailto:support@y-us.store" className="text-slate-400 transition hover:text-slate-200">
            support@y-us.store
          </a>
        </p>

      </div>
    </div>
  )
}
