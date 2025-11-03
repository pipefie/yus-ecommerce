// src/app/account/page.tsx
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShoppingBag, Truck, UserCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function formatCurrency(cents: number | null | undefined): string {
  return currencyFormatter.format(((cents ?? 0) as number) / 100);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function getInitials(name?: string | null): string {
  if (!name) return "YOU";
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "YOU";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function AccountPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?returnTo=/account");

  const dbUser = await prisma.user.findUnique({
    where: { sub: sessionUser.sub },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      role: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    redirect("/auth/logout?returnTo=/");
  }

  const [orderAggregate, totalOrders, openOrders, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { userId: dbUser.id },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { userId: dbUser.id } }),
    prisma.order.count({ where: { userId: dbUser.id, status: { in: ["pending", "paid"] } } }),
    prisma.order.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalAmount: true,
        items: true,
      },
    }),
  ]);

  const totalSpent = orderAggregate._sum.totalAmount ?? 0;
  const joinDate = formatDate(dbUser.createdAt);

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-200",
    paid: "bg-sky-500/20 text-sky-200",
    fulfilled: "bg-emerald-500/20 text-emerald-200",
    refunded: "bg-rose-500/20 text-rose-200",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-24 pt-28 md:px-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-8 shadow-2xl backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-600/20 via-transparent to-transparent" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-white/20 bg-white/5 text-lg font-semibold uppercase tracking-[0.2em] text-white/80">
                {dbUser.picture ? (
                  <Image
                    src={dbUser.picture}
                    alt={dbUser.name ?? "Account avatar"}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  getInitials(dbUser.name)
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/40">Account</p>
                <h1 className="text-3xl font-semibold text-white">
                  Welcome back{dbUser.name ? `, ${dbUser.name.split(" ")[0]}` : ""}
                </h1>
                <p className="mt-2 text-sm text-white/60">{dbUser.email ?? "No email on file"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-wide text-white/70">
                {dbUser.role === "admin" ? "Admin" : "Member"}
              </span>
              <Link
                href="/auth/logout?returnTo=/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/20"
              >
                <LogOut size={16} />
                Sign out
              </Link>
            </div>
          </div>

          <dl className="relative mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <dt className="text-xs uppercase tracking-[0.3em] text-white/40">Total spent</dt>
              <dd className="mt-3 text-2xl font-semibold text-white">{formatCurrency(totalSpent)}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <dt className="text-xs uppercase tracking-[0.3em] text-white/40">Orders</dt>
              <dd className="mt-3 text-2xl font-semibold text-white">{totalOrders}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <dt className="text-xs uppercase tracking-[0.3em] text-white/40">Member since</dt>
              <dd className="mt-3 text-lg font-semibold text-white">{joinDate}</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Recent activity</h2>
                  <p className="text-sm text-white/60">Your last orders and their current status.</p>
                </div>
                <Link
                  href="/orders"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:bg-white/10"
                >
                  View all orders
                </Link>
              </header>

              <div className="mt-6 space-y-4">
                {recentOrders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
                    No orders yet. Discover new drops and gear up in the shop.
                  </div>
                )}

                {recentOrders.map((order) => {
                  const statusKey = order.status?.toLowerCase() ?? "pending";
                  const badgeClass = statusStyles[statusKey] ?? "bg-slate-500/20 text-slate-200";
                  const itemCount = Array.isArray(order.items)
                    ? (order.items as Array<{ quantity?: number }>).reduce(
                        (total, item) => total + (Number(item.quantity) || 0),
                        0,
                      )
                    : 0;

                  return (
                    <article
                      key={order.id}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-white/40">Order #{order.id}</p>
                        <p className="mt-1 text-lg font-medium text-white">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-white/50">Placed on {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-sm text-white/70 sm:items-end">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${badgeClass}`}>
                          {order.status}
                        </span>
                        <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-7 backdrop-blur">
              <h3 className="text-base font-semibold text-white">Quick actions</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/70">
                <li>
                  <Link
                    href="/orders"
                    className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <ShoppingBag className="shrink-0 text-sky-400 transition group-hover:text-sky-300" size={18} />
                    <div>
                      <p className="font-medium text-white">Order history</p>
                      <p className="text-xs text-white/50">Track past and current purchases.</p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders?status=open"
                    className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <Truck className="shrink-0 text-emerald-400 transition group-hover:text-emerald-300" size={18} />
                    <div>
                      <p className="font-medium text-white">Active orders</p>
                      <p className="text-xs text-white/50">{openOrders} currently in production or transit.</p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account?tab=profile"
                    className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <UserCog className="shrink-0 text-violet-400 transition group-hover:text-violet-300" size={18} />
                    <div>
                      <p className="font-medium text-white">Profile & preferences</p>
                      <p className="text-xs text-white/50">Manage notifications and saved info.</p>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent p-7 text-sm text-white/70 shadow-inner backdrop-blur">
              <h3 className="text-base font-semibold text-white">Y-US+ Insider</h3>
              <p className="mt-3 leading-6 text-white/70">
                Stay tuned for loyalty drops, early access to collaborations, and styling tips tailored to your vibe.
              </p>
              <button
                className="mt-5 inline-flex items-center justify-center rounded-full border border-sky-400/50 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 transition hover:border-sky-300 hover:bg-sky-500/20"
                type="button"
              >
                Join the waitlist
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
