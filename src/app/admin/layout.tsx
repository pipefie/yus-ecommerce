import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { SidebarNav } from "@/components/admin/SidebarNav";
import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/permissions", label: "Permissions" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const userLabel = user.email ?? user.sub;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-10 xl:px-10">
        <aside className="sticky top-10 hidden h-[calc(100vh-5rem)] w-64 flex-shrink-0 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 lg:flex lg:flex-col">
          <div className="mb-6">
            <Link href="/admin" className="inline-flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Y‑US</span>
              <span className="text-sm font-semibold text-slate-200">Admin Console</span>
            </Link>
          </div>
          <SidebarNav
            items={navItems.map((item) => ({
              ...item,
              description:
                item.href === "/admin/products"
                  ? "Manage catalog, mockups, pricing"
                  : item.href === "/admin/orders"
                    ? "Order status & fulfilment"
                    : undefined,
            }))}
          />
          <div className="mt-auto rounded-lg border border-slate-800/80 bg-slate-900/60 p-4 text-xs text-slate-300">
            <p className="font-medium text-slate-200">Signed in</p>
            <p className="truncate text-slate-400">{userLabel}</p>
            <p className="mt-3 text-[11px] text-slate-500">
              Tip: press&nbsp;
              <span className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-slate-200">⌘</span>
              <span className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-slate-200">K</span>
              &nbsp;for quick actions (coming soon).
            </p>
          </div>
        </aside>
        <section className="flex-1 space-y-6">
          <header className="sticky top-10 z-10 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-lg font-semibold text-slate-100">Admin workspace</h1>
                <p className="text-xs text-slate-400">
                  Search, edit, and monitor store data. Improvements are rolling out—share feedback anytime.
                </p>
              </div>
              <form
                action="/admin/search"
                className="relative flex w-full items-center gap-2 md:w-72"
                role="search"
              >
                <input
                  name="q"
                  placeholder="Search products, orders, users…"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700"
                />
                <button
                  type="submit"
                  className="absolute right-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-slate-700"
                >
                  Search
                </button>
              </form>
            </div>
          </header>
          <main className="space-y-8">{children}</main>
        </section>
      </div>
    </div>
  );
}
