import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/layout";
import { Eyebrow, PageTitle, BodyText } from "@/components/ui/typography";

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
    <Section as="main" padding="wide" className="min-h-screen bg-surface-soft text-foreground space-y-4">
      <Eyebrow align="center">Order detail</Eyebrow>
      <PageTitle align="center" className="font-display">Order #{order.id}</PageTitle>
      <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-subtle bg-card p-5">
        <BodyText tone="muted">Status: <span className="capitalize text-foreground">{order.status}</span></BodyText>
        <BodyText tone="muted">
          Total: <span className="text-foreground">{order.currency.toUpperCase()} {(order.totalAmount / 100).toFixed(2)}</span>
        </BodyText>
      </div>
    </Section>
  );
}
