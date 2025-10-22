import { prisma } from "@/lib/prisma";

function formatCurrency(cents: number): string {
  return `€ ${(cents / 100).toFixed(2)}`;
}

function getLastNDates(days: number): Date[] {
  const out: Date[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    out.push(d);
  }
  return out;
}

export default async function AdminDashboard() {
  const [orderAggregate, ordersCount, paidOrders] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: "paid" } }),
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: "paid" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const totalRevenue = orderAggregate._sum.totalAmount ?? 0;
  const uniqueCustomers = new Set(paidOrders.map((order) => order.userId ?? order.stripeSessionId)).size;

  const revenueByDayMap = new Map<string, number>();
  for (const order of paidOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    revenueByDayMap.set(key, (revenueByDayMap.get(key) ?? 0) + order.totalAmount);
  }

  const chartDays = getLastNDates(7).map((date) => {
    const key = date.toISOString().slice(0, 10);
    return { date: key, total: revenueByDayMap.get(key) ?? 0 };
  });
  const maxRevenue = chartDays.reduce((max, day) => Math.max(max, day.total), 0);

  const productTally = new Map<string, { quantity: number; revenue: number }>();
  for (const order of paidOrders) {
    const items = Array.isArray(order.items) ? (order.items as unknown as Array<{ productId?: number; slug?: string; quantity?: number; unitPriceCents?: number }>) : [];
    for (const item of items) {
      const productId = String(item.productId ?? item.slug ?? "unknown");
      const quantity = Number(item.quantity) || 0;
      const revenue = (Number(item.unitPriceCents) || 0) * quantity;
      const record = productTally.get(productId) ?? { quantity: 0, revenue: 0 };
      record.quantity += quantity;
      record.revenue += revenue;
      productTally.set(productId, record);
    }
  }

  const topProducts = Array.from(productTally.entries())
    .map(([key, value]) => ({ productId: key, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Revenue (paid)</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Orders</p>
          <p className="mt-3 text-2xl font-semibold">{ordersCount}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Customers</p>
          <p className="mt-3 text-2xl font-semibold">{uniqueCustomers}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Avg. Order Value</p>
          <p className="mt-3 text-2xl font-semibold">
            {ordersCount ? formatCurrency(Math.round(totalRevenue / ordersCount)) : "€ 0.00"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-200">Revenue (last 7 days)</h2>
          <div className="mt-6 h-48">
            <svg viewBox="0 0 280 160" className="h-full w-full">
              {chartDays.map((day, idx) => {
                const height = maxRevenue ? Math.max((day.total / maxRevenue) * 120, 4) : 4;
                const x = idx * 40 + 20;
                const y = 140 - height;
                return (
                  <g key={day.date}>
                    <rect x={x} y={y} width={24} height={height} rx={6} fill="#38bdf8" opacity={0.8} />
                    <text x={x + 12} y={150} textAnchor="middle" fontSize="10" fill="#94a3b8">
                      {day.date.slice(5)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-sm font-semibold text-slate-200">Top Products</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {topProducts.length === 0 && <li className="text-xs text-slate-500">No paid orders yet.</li>}
            {topProducts.map((item) => (
              <li key={item.productId} className="flex items-center justify-between">
                <span>{item.productId}</span>
                <span className="text-slate-400">{formatCurrency(item.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Recent Orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Placed</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {paidOrders.slice(0, 10).map((order) => (
                <tr key={order.id}>
                  <td className="py-2 pr-4 text-xs">#{order.id}</td>
                  <td className="py-2 pr-4 text-xs text-slate-400">{order.createdAt.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-xs">
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-green-300">{order.status}</span>
                  </td>
                  <td className="py-2 pr-4 text-xs">{formatCurrency(order.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
