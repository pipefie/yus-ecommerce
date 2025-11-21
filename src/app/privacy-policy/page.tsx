import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/layout";
import { Eyebrow, PageTitle, BodyText } from "@/components/ui/typography";

export const metadata = { title: "Privacy Policy" };
export const revalidate = 60;

export default async function PrivacyPolicyPage() {
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
        {safe("privacy_policy_title", "Privacy Policy")}
      </PageTitle>
      <BodyText tone="muted" className="max-w-3xl text-center self-center">
        {safe(
          "privacy_policy_intro",
          "We value your privacy and only collect data necessary to run this store. Please contact us if you have any questions.",
        )}
      </BodyText>
    </Section>
  );
}
