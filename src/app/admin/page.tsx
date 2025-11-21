import { prisma } from "@/lib/prisma";
import { triggerPrintfulSyncAction } from "@/app/admin/actions";

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
  const [orderAggregate, ordersCount, paidOrders, recentSyncs, archivedProducts, missingMockups] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: "paid" } }),
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: "paid" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.printfulSyncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.product.count({ where: { deleted: true } }),
    prisma.product.count({
      where: {
        deleted: false,
        productImages: { none: { selected: true } },
      },
    }),
  ]);

  const behaviorSince = new Date();
  behaviorSince.setDate(behaviorSince.getDate() - 14);
  const recentEvents = await prisma.userEvent.findMany({
    where: { ts: { gte: behaviorSince } },
    select: { event: true, entityType: true, entityId: true, metadata: true, ts: true },
    orderBy: { ts: "desc" },
    take: 800,
  });

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

  const eventTally = recentEvents.reduce(
    (acc, evt) => {
      acc.total++;
      acc.byEvent.set(evt.event, (acc.byEvent.get(evt.event) ?? 0) + 1);
      if (evt.event === "add_to_cart" && evt.entityId) {
        acc.addToCart.set(evt.entityId, (acc.addToCart.get(evt.entityId) ?? 0) + 1);
      }
      if (evt.event === "view_product" && evt.entityId) {
        acc.views.set(evt.entityId, (acc.views.get(evt.entityId) ?? 0) + 1);
      }
      return acc;
    },
    {
      total: 0,
      byEvent: new Map<string, number>(),
      addToCart: new Map<string, number>(),
      views: new Map<string, number>(),
    },
  );

  const sortedEvents = Array.from(eventTally.byEvent.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topViewed = Array.from(eventTally.views.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topAdds = Array.from(eventTally.addToCart.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lastSync = recentSyncs[0] ?? null;
  const lastSyncFinished = lastSync?.finishedAt ?? lastSync?.startedAt ?? null;
  const syncAgeHours = lastSyncFinished ? (Date.now() - lastSyncFinished.getTime()) / 36e5 : null;
  const syncIsStale = syncAgeHours === null || syncAgeHours > 6;
  const syncStatusColor =
    lastSync?.status === "failed"
      ? "bg-red-500/20 text-red-300 border-red-500/50"
      : syncIsStale
        ? "bg-amber-500/20 text-amber-200 border-amber-500/50"
        : "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Printful Sync</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-full border px-3 py-1 ${syncStatusColor}`}>
                {lastSync?.status === "failed" ? "Sync failed" : syncIsStale ? "Stale" : "Healthy"}
              </span>
              <span className="text-slate-400">
                Last run: {lastSyncFinished ? lastSyncFinished.toLocaleString() : "Never"}
              </span>
            </div>
            {lastSync?.error && (
              <p className="mt-2 text-xs text-red-300">Error: {lastSync.error}</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Processed: {lastSync?.processedProducts ?? 0} products / {lastSync?.processedVariants ?? 0} variants
              {lastSync && (
                <> • Archived: {lastSync.archivedProducts} products / {lastSync.archivedVariants} variants</>
              )}
            </p>
          </div>
          <form action={triggerPrintfulSyncAction} className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="mode"
              value="append"
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-slate-700"
            >
              Sync catalog
            </button>
            <button
              type="submit"
              name="mode"
              value="replace"
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20"
            >
              Clear & Sync
            </button>
          </form>
        </div>
        {recentSyncs.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Started</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Processed</th>
                  <th className="py-2 pr-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {recentSyncs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-3">{log.startedAt.toLocaleString()}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          log.status === "failed" ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-200"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-400">
                      {log.processedProducts} products / {log.processedVariants} variants
                      <span className="text-slate-500">
                        {" "}
                        (archived {log.archivedProducts}/{log.archivedVariants})
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-400">{log.actor ?? "unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {(archivedProducts > 0 || missingMockups > 0) && (
        <section className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-6 text-sm text-amber-100">
          <h3 className="text-xs uppercase tracking-wide text-amber-300">Catalog attention</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {archivedProducts > 0 && <li>{archivedProducts} products are flagged as removed in Printful.</li>}
            {missingMockups > 0 && (
              <li>{missingMockups} active products are missing mockups—upload fresh archives to keep PDPs sharp.</li>
            )}
          </ul>
        </section>
      )}

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

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Behavioral signals (last 14 days)</h2>
        <p className="text-xs text-slate-500">Events streamed from client-side analytics for on-site behavior.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total events</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{eventTally.total}</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              {sortedEvents.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between">
                  <span>{name}</span>
                  <span className="text-slate-200">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Top viewed products</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              {topViewed.length === 0 && <li className="text-slate-500">No views recorded</li>}
              {topViewed.map(([productId, count]) => (
                <li key={productId} className="flex items-center justify-between">
                  <span>{productId}</span>
                  <span className="text-slate-200">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Top add-to-cart products</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              {topAdds.length === 0 && <li className="text-slate-500">No add-to-cart events</li>}
              {topAdds.map(([productId, count]) => (
                <li key={productId} className="flex items-center justify-between">
                  <span>{productId}</span>
                  <span className="text-slate-200">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
