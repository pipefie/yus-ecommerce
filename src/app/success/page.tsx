import Link from "next/link";
import { stripe } from "@/utils/stripe";
import type Stripe from "stripe";
import PurchaseTracker from "../../components/PurchaseTracker";
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers';
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
    <div className="pt-16 min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 text-center">
      <h1 className="font-pixel text-4xl text-neon mb-4">{t('thank_you')}</h1>
      {items.length > 0 && (
        <div className="w-full max-w-md bg-gray-900 p-6 rounded-lg shadow-neon mb-6">
          <h2 className="font-pixel text-2xl mb-4">Order Summary</h2>
          <ul className="space-y-2 mb-4">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.description} × {item.quantity}</span>
                <span>{symbols[currency] || ''}{((item.amount_total ?? 0) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold border-t border-gray-700 pt-2">
            <span>Total</span>
            <span>{symbols[currency] || ''}{total.toFixed(2)}</span>
          </div>
        </div>
      )}
      <Link href="/products" className="px-6 py-3 bg-neon text-black font-pixel rounded hover:bg-neon/80 transition">
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
    </div>
  );
}
