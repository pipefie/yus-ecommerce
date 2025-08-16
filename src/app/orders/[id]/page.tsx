import { redirect, notFound } from "next/navigation";
import auth0 from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const session = await auth0.getSession();
  if (!session) redirect(`/signin?returnTo=/orders/${params.id}`);
  const userId = Number((session.user as any).id);
  const order = await prisma.order.findFirst({
    where: { id: Number(params.id), userId },
  });
  if (!order) notFound();
  return (
    <div className="pt-16 container mx-auto px-4 py-8">
      <h1 className="font-pixel text-3xl mb-6">Order #{order.id}</h1>
      <p className="mb-2">Status: <span className="capitalize">{order.status}</span></p>
      <p>Total: {order.currency.toUpperCase()} {(order.totalAmount / 100).toFixed(2)}</p>
    </div>
  );
}