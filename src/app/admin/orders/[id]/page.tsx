import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/session'
import {
  updateOrderStatusAction,
  updateTrackingNumberAction,
  resubmitToPrintfulAction,
} from '@/app/admin/actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents: number, currency: string) {
  const symbols: Record<string, string> = { eur: '€', usd: '$', gbp: '£' }
  const sym = symbols[currency.toLowerCase()] ?? currency.toUpperCase() + ' '
  return `${sym}${(cents / 100).toFixed(2)}`
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300',
    paid: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    fulfilled: 'border-blue-500/40 bg-blue-500/15 text-blue-300',
    refunded: 'border-red-500/40 bg-red-500/15 text-red-300',
  }
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${cls[status] ?? 'border-slate-500/40 bg-slate-500/15 text-slate-300'}`}>
      {status}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') redirect('/')

  const { id } = await props.params
  const orderId = Number(id)
  if (!orderId) notFound()

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!order) notFound()

  // Enrich items with product/variant info
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

  const addr = order.shippingAddress as Record<string, string> | null
  const customerName = order.customerName ?? order.user?.name ?? null
  const customerEmail = order.customerEmail ?? order.user?.email ?? null

  // ─── Status update form (inline server action) ──────────────────────────────
  async function statusAction(formData: FormData) {
    'use server'
    const status = String(formData.get('status') ?? '')
    await updateOrderStatusAction(orderId, status)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="text-sm text-slate-400 transition hover:text-slate-200"
          >
            ← Orders
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              Order <span className="font-mono">#{order.id}</span>
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {order.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' '}at{' '}
              {order.createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Quick status update */}
        <form action={statusAction} className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={order.status}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-slate-600 focus:outline-none"
          >
            {['pending', 'paid', 'fulfilled', 'refunded'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Update status
          </button>
        </form>
      </div>

      {/* Customer + Shipping */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Customer */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
          {customerName || customerEmail ? (
            <div className="space-y-1">
              {customerName && <p className="font-semibold text-slate-200">{customerName}</p>}
              {customerEmail && (
                <a
                  href={`mailto:${customerEmail}`}
                  className="block text-sm text-slate-400 transition hover:text-slate-200"
                >
                  {customerEmail}
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Guest checkout — no account</p>
          )}
          <div className="mt-4 border-t border-slate-800 pt-3">
            <p className="mb-1 text-xs text-slate-600">Stripe session</p>
            <p className="break-all font-mono text-xs text-slate-500">{order.stripeSessionId}</p>
          </div>
        </section>

        {/* Shipping address */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ship to</p>
          {addr ? (
            <address className="not-italic text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-200">{customerName ?? 'Customer'}</span><br />
              {addr.line1}<br />
              {addr.line2 && <>{addr.line2}<br /></>}
              {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip}<br />
              <span className="font-semibold">{addr.country?.toUpperCase()}</span>
            </address>
          ) : (
            <p className="text-sm text-slate-500">No shipping address on record</p>
          )}
        </section>
      </div>

      {/* Items */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Items ordered</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" colSpan={2}>Product</th>
                <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {enrichedItems.map((item, i) => {
                const unitCents = Number(item.unitPriceCents) || 0
                const qty = Number(item.quantity) || 1
                return (
                  <tr key={i}>
                    <td className="py-3 pr-3 w-12">
                      {item.variant?.product?.imageUrl ? (
                        <Image
                          src={item.variant.product.imageUrl}
                          alt={item.variant.product.title ?? ''}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-slate-800" />
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-200">
                        {item.variant?.product?.title ?? `Product #${item.productId ?? '?'}`}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-slate-500">
                          {[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-center text-slate-300">{qty}</td>
                    <td className="py-3 text-right text-slate-400">{formatPrice(unitCents, order.currency)}</td>
                    <td className="py-3 text-right font-semibold text-slate-200">{formatPrice(unitCents * qty, order.currency)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700">
                <td colSpan={4} className="pt-3 text-right text-xs uppercase tracking-wide text-slate-500">Total</td>
                <td className="pt-3 text-right text-lg font-bold text-slate-100">
                  {formatPrice(order.totalAmount, order.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Fulfillment */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Printful */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Printful</p>

          {order.printfulOrderId ? (
            <div className="mb-4">
              <p className="text-xs text-slate-500">Printful order ID</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-300">{order.printfulOrderId}</p>
              <a
                href="https://www.printful.com/dashboard/order-list"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-slate-400 transition hover:text-slate-200"
              >
                View in Printful dashboard →
              </a>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <p className="text-xs font-semibold text-amber-300">Not yet submitted to Printful</p>
              <p className="mt-0.5 text-xs text-amber-300/70">
                {addr ? 'Use the button below to submit.' : 'No shipping address on record — cannot submit.'}
              </p>
            </div>
          )}

          {addr && (
            <form action={resubmitToPrintfulAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                {order.printfulOrderId ? 'Re-submit to Printful' : 'Submit to Printful'}
              </button>
            </form>
          )}
        </section>

        {/* Tracking */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tracking</p>

          {order.trackingNumber ? (
            <div className="mb-4">
              <p className="text-xs text-slate-500">Tracking number</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-300">{order.trackingNumber}</p>
            </div>
          ) : (
            <p className="mb-4 text-sm text-slate-500">No tracking number yet — will be added automatically when Printful ships.</p>
          )}

          <form action={updateTrackingNumberAction} className="flex gap-2">
            <input type="hidden" name="orderId" value={order.id} />
            <input
              name="trackingNumber"
              placeholder="Enter tracking number"
              defaultValue={order.trackingNumber ?? ''}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              Save
            </button>
          </form>
        </section>
      </div>

    </div>
  )
}
