import Link from "next/link"
import { cookies } from "next/headers"
import { getTranslations } from "next-intl/server"

export const metadata = { title: "Cookie Policy" }
export const revalidate = 60

export default async function CookiePolicyPage() {
  const cookieStore = await cookies()
  const lang = cookieStore.get("language")?.value || "en"
  const t = await getTranslations({ locale: lang })

  return (
    <div className="pt-16 container mx-auto px-4 text-white">
      <h1 className="font-pixel text-3xl mb-4">{t('cookie_policy_title')}</h1>
      <p className="mb-6">{t('cookie_policy_intro')}</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">{t('cookie_essential_title')}</h2>
        <p>{t('cookie_essential_purpose')}</p>
        <p className="text-sm text-gray-400">{t('cookie_essential_duration')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">{t('cookie_analytics_title')}</h2>
        <p>{t('cookie_analytics_purpose')}</p>
        <p className="text-sm text-gray-400">{t('cookie_analytics_duration')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">{t('cookie_marketing_title')}</h2>
        <p>{t('cookie_marketing_purpose')}</p>
        <p className="text-sm text-gray-400">{t('cookie_marketing_duration')}</p>
      </section>

      <p>
        {t('cookie_preferences_intro')}{" "}
        <Link href="#cookie-banner" className="underline">
          {t('cookie_preferences_link')}
        </Link>{" "}
        {t('cookie_preferences_outro')}
      </p>
    </div>
  )
}