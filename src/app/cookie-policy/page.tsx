import Link from "next/link"
import { cookies } from "next/headers"
import { getTranslations } from "next-intl/server"
import { Section } from "@/components/ui/layout"
import { Eyebrow, PageTitle, SectionTitle, BodyText } from "@/components/ui/typography"

export const metadata = { title: "Cookie Policy" }
export const revalidate = 60

export default async function CookiePolicyPage() {
  const cookieStore = await cookies()
  const lang = cookieStore.get("language")?.value || "en"
  const t = await getTranslations({ locale: lang })

  return (
    <Section as="main" padding="wide" className="min-h-screen bg-surface-soft text-foreground space-y-6">
      <div className="text-center space-y-2">
        <Eyebrow align="center">Policy</Eyebrow>
        <PageTitle align="center" className="font-display text-neon">{t('cookie_policy_title')}</PageTitle>
        <BodyText tone="muted" className="text-center">{t('cookie_policy_intro')}</BodyText>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-subtle bg-card/60 p-5 shadow-soft">
          <SectionTitle align="left" className="text-lg">{t('cookie_essential_title')}</SectionTitle>
          <BodyText tone="muted" className="mt-2">{t('cookie_essential_purpose')}</BodyText>
          <p className="text-sm text-muted mt-2">{t('cookie_essential_duration')}</p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card/60 p-5 shadow-soft">
          <SectionTitle align="left" className="text-lg">{t('cookie_analytics_title')}</SectionTitle>
          <BodyText tone="muted" className="mt-2">{t('cookie_analytics_purpose')}</BodyText>
          <p className="text-sm text-muted mt-2">{t('cookie_analytics_duration')}</p>
        </section>

        <section className="rounded-2xl border border-subtle bg-card/60 p-5 shadow-soft">
          <SectionTitle align="left" className="text-lg">{t('cookie_marketing_title')}</SectionTitle>
          <BodyText tone="muted" className="mt-2">{t('cookie_marketing_purpose')}</BodyText>
          <p className="text-sm text-muted mt-2">{t('cookie_marketing_duration')}</p>
        </section>
      </div>

      <BodyText tone="muted">
        {t('cookie_preferences_intro')}{" "}
        <Link href="#cookie-banner" className="underline">
          {t('cookie_preferences_link')}
        </Link>{" "}
        {t('cookie_preferences_outro')}
      </BodyText>
    </Section>
  )
}
