import Link from "next/link";
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export const revalidate = 0;

export default async function CancelPage() {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en';
  const t = await getTranslations({ locale: lang });

  return (
    <div className="pt-16 min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 text-center">
      <h1 className="font-pixel text-4xl text-neon mb-4">{t('checkout_cancelled')}</h1>
      <p className="mb-6">{t('try_again')}</p>
      <Link href="/cart" className="px-6 py-3 bg-neon text-black font-pixel rounded hover:bg-neon/80 transition">
        {t('cart')}
      </Link>
    </div>
  );
}