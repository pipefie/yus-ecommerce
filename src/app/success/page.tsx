import Link from "next/link";
import { stripe } from "@/utils/stripe";
import type Stripe from "stripe";
import PurchaseTracker from "../../components/PurchaseTracker";
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers';
import { Section } from "@/components/ui/layout";
import { Eyebrow, PageTitle, SectionTitle } from "@/components/ui/typography";
export const revalidate = 0

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en'
  const t = await getTranslations({ locale: lang })
  let items: Stripe.LineItem[] = [];
  let total = 0;
  let currency = 'USD';
  const symbols: Record<string,string> = { USD: '$', EUR: '€', GBP: '£' };

  const sessionId = searchParams.session_id;
  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    items = lineItems.data;
    total = (session.amount_total ?? 0) / 100;
    currency = session.currency?.toUpperCase() || 'USD';
  }

  return (
    <Section as="main" padding="wide" className="min-h-screen flex flex-col items-center justify-center bg-surface-soft text-foreground text-center">
      <Eyebrow align="center">Order confirmed</Eyebrow>
      <PageTitle align="center" className="font-display text-neon">{t('thank_you')}</PageTitle>
      {items.length > 0 && (
        <div className="mt-6 w-full max-w-md rounded-3xl border border-subtle bg-surface-soft/80 p-6 shadow-soft">
          <SectionTitle align="center">Order Summary</SectionTitle>
          <ul className="space-y-2 mb-4 mt-3 text-left text-sm text-muted">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.description} × {item.quantity}</span>
                <span className="text-foreground">{symbols[currency] || ''}{((item.amount_total ?? 0) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold border-t border-subtle pt-2">
            <span>Total</span>
            <span>{symbols[currency] || ''}{total.toFixed(2)}</span>
          </div>
        </div>
      )}
      <Link href="/products" className="mt-4 inline-flex items-center justify-center rounded-full bg-neon px-6 py-3 font-semibold text-slate-950 transition hover:brightness-105">
        {t('back_to_shop')}
      </Link>
      {items.length > 0 && 
        (<PurchaseTracker 
          items={items.map(item => ({
            ...item,
            description: item.description ?? "",
          }))} 
          total={total} 
        />)}
    </Section>
  );
}
