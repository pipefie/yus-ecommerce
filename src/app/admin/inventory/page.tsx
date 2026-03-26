import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const variants = await prisma.variant.findMany({
    orderBy: { updatedAt: "desc" },
    include: { product: { select: { title: true, slug: true } } },
  });

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Inventory</h2>
        <p className="text-xs text-slate-400">
          Inventory tracking will be available once stock integration is enabled.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs text-slate-300">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Variant</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Stock (planned)</th>
              <th className="py-2 pr-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {variants.map((variant) => (
              <tr key={variant.id}>
                <td className="py-2 pr-3 text-slate-200">
                  {variant.product?.title}
                  <span className="ml-2 text-slate-500">({variant.product?.slug})</span>
                </td>
                <td className="py-2 pr-3 text-slate-200">{variant.color} / {variant.size}</td>
                <td className="py-2 pr-3">€ {(variant.price / 100).toFixed(2)}</td>
                <td className="py-2 pr-3">
                  <input
                    disabled
                    value="N/A"
                    className="w-20 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-center text-slate-500"
                  />
                </td>
                <td className="py-2 pr-3 text-slate-500">Stock tracking coming soon.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
