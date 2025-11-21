import Link from "next/link";
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { Section } from "@/components/ui/layout";
import { Eyebrow, PageTitle, BodyText } from "@/components/ui/typography";

export const revalidate = 0;

export default async function CancelPage() {
  const cookie = await cookies();
  const lang = cookie.get('language')?.value || 'en';
  const t = await getTranslations({ locale: lang });

  return (
    <Section as="main" padding="wide" className="min-h-screen flex flex-col items-center justify-center bg-surface-soft text-foreground text-center">
      <Eyebrow align="center">{t('cart')}</Eyebrow>
      <PageTitle align="center" className="font-display text-neon">{t('checkout_cancelled')}</PageTitle>
      <BodyText tone="muted" className="mt-4 text-center">{t('try_again')}</BodyText>
      <Link href="/cart" className="mt-6 inline-flex items-center justify-center rounded-full bg-neon px-6 py-3 font-semibold text-slate-950 transition hover:brightness-105">
        {t('cart')}
      </Link>
    </Section>
  );
}
