import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/layout";
import { Eyebrow, PageTitle, BodyText } from "@/components/ui/typography";

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?returnTo=/orders");

  const dbUser = await prisma.user.findUnique({
    where: { sub: user.sub },
    select: { id: true },
  });
  if (!dbUser) {
    redirect("/login?returnTo=/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Section as="main" padding="wide" className="min-h-screen bg-surface-soft text-foreground space-y-6">
      <div className="text-center space-y-2">
        <Eyebrow align="center">Account</Eyebrow>
        <PageTitle align="center" className="font-display">Your Orders</PageTitle>
        <BodyText tone="muted" className="text-center">Track your recent purchases and download details.</BodyText>
      </div>
      {!orders.length && <BodyText tone="muted" className="text-center">No orders yet.</BodyText>}
      <ul className="space-y-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-col gap-3 rounded-2xl border border-subtle bg-card p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-base font-semibold text-foreground">Order #{order.id}</p>
              <p className="text-sm text-muted capitalize">Status: {order.status}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-foreground font-semibold">
                {order.currency.toUpperCase()} {(order.totalAmount / 100).toFixed(2)}
              </span>
              <Link
                href={`/orders/${order.id}`}
                className="rounded-full border border-subtle px-3 py-1 text-sm text-foreground transition hover:border-neon hover:text-neon"
              >
                Details
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
