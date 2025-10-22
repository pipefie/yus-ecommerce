import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type OrderPageParams = Promise<{ id: string }>;

export default async function OrderDetail({ params }: { params: OrderPageParams }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?returnTo=/orders/${id}`);

  const dbUser = await prisma.user.findUnique({
    where: { sub: user.sub },
    select: { id: true },
  });
  if (!dbUser) redirect(`/login?returnTo=/orders/${id}`);

  const order = await prisma.order.findFirst({
    where: { id: Number(id), userId: dbUser.id },
  });
  if (!order) notFound();

  return (
    <div className="pt-16 container mx-auto px-4 py-8">
      <h1 className="font-pixel text-3xl mb-6">Order #{order.id}</h1>
      <p className="mb-2">
        Status: <span className="capitalize">{order.status}</span>
      </p>
      <p>Total: {order.currency.toUpperCase()} {(order.totalAmount / 100).toFixed(2)}</p>
    </div>
  );
}