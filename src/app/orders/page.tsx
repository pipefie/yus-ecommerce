import { redirect } from "next/navigation";
import Link from "next/link";
import auth0 from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/signin?returnTo=/orders");
  const userId = Number((session.user as any).id);

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pt-16 container mx-auto px-4 py-8">
      <h1 className="font-pixel text-3xl mb-6">Your Orders</h1>
      {!orders.length && <p>No orders yet.</p>}
      <ul className="space-y-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex justify-between items-center border-b border-white/10 pb-2"
          >
            <div>
              <p className="text-sm text-white/60">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="font-bold capitalize">{order.status}</p>
            </div>
            <div className="flex items-center gap-4">
              <span>
                {order.currency.toUpperCase()} {(order.totalAmount / 100).toFixed(2)}
              </span>
              <Link
                href={`/orders/${order.id}`}
                className="text-indigo-400 hover:underline"
              >
                Details
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}