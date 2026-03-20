import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import Link from 'next/link'
import { updateOrderStatusAction } from '../actions'

const ORDER_STATUSES = ['all', 'pending', 'paid', 'fulfilled', 'refunded'] as const
type OrderStatus = (typeof ORDER_STATUSES)[number]

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300',
    paid: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    fulfilled: 'border-blue-500/40 bg-blue-500/15 text-blue-300',
    refunded: 'border-red-500/40 bg-red-500/15 text-red-300',
  }
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${cls[status] ?? 'border-slate-500/40 bg-slate-500/15 text-slate-300'}`}
    >
      {status}
    </span>
  )
}

async function UpdateStatusForm({ orderId, current }: { orderId: number; current: string }) {
  async function action(formData: FormData) {
    'use server'
    const status = String(formData.get('status') ?? '')
    await updateOrderStatusAction(orderId, status)
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <select
        name="status"
        defaultValue={current}
        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-slate-600 focus:outline-none"
      >
        {['pending', 'paid', 'fulfilled', 'refunded'].map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
      >
        Save
      </button>
    </form>
  )
}

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') redirect('/')

  const searchParams = await props.searchParams
  const activeStatus: OrderStatus = (ORDER_STATUSES as readonly string[]).includes(
    searchParams.status ?? ''
  )
    ? (searchParams.status as OrderStatus)
    : 'all'

  const where = activeStatus !== 'all' ? { status: activeStatus } : {}

  const [orders, tabCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    Promise.all(
      ORDER_STATUSES.map(async (s) => ({
        status: s,
        count: await prisma.order.count({ where: s !== 'all' ? { status: s } : {} }),
      }))
    ),
  ])

  const countMap = Object.fromEntries(tabCounts.map(({ status, count }) => [status, count]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Orders</h1>
        <p className="mt-1 text-sm text-slate-400">
          Review and update order status. Changes take effect immediately.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/admin/orders' : `/admin/orders?status=${s}`}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeStatus === s
                ? 'border-slate-500 bg-slate-700 text-slate-100'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className="capitalize">{s}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                activeStatus === s ? 'bg-slate-600 text-slate-200' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {countMap[s] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 px-8 py-16 text-center">
          <p className="text-slate-400">No orders yet.</p>
          <p className="mt-1 text-sm text-slate-600">
            When customers check out, their orders will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Order #
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Items
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((order) => {
                  const itemCount = Array.isArray(order.items) ? order.items.length : 0
                  const total = `${(order.totalAmount / 100).toFixed(2)} ${order.currency.toUpperCase()}`
                  const date = order.createdAt.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })

                  return (
                    <tr
                      key={order.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4 font-mono text-slate-300">#{order.id}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {order.user?.email ?? (
                          <span className="text-slate-500">Guest</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400">{itemCount}</td>
                      <td className="px-5 py-4 font-medium text-slate-200">{total}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-400">{date}</td>
                      <td className="px-5 py-4">
                        <UpdateStatusForm orderId={order.id} current={order.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
