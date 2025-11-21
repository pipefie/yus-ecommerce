import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/layout";
import { Eyebrow, PageTitle, BodyText } from "@/components/ui/typography";

export const metadata = { title: "Terms & Conditions" };
export const revalidate = 60;

export default async function TermsPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("language")?.value || "en";
  const t = await getTranslations({ locale: lang });
  const safe = (key: string, fallback: string) => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };

  return (
    <Section as="main" padding="wide" className="min-h-screen bg-surface-soft text-foreground space-y-4">
      <Eyebrow align="center">Policy</Eyebrow>
      <PageTitle align="center" className="font-display text-neon">
        {safe("terms_title", "Terms & Conditions")}
      </PageTitle>
      <BodyText tone="muted" className="max-w-3xl text-center self-center">
        {safe("terms_intro", "Use of this site is subject to standard ecommerce terms and conditions.")}
      </BodyText>
    </Section>
  );
}
