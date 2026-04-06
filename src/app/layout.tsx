import "./globals.css";
import { Press_Start_2P } from "next/font/google";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { CartProvider } from "@/context/CartContext";
import CookieBanner from "../components/CookieBanner";
import AnalyticsScripts from "../components/AnalyticsScripts";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";

export const metadata = {
  title: "Y-US? Store",
  description: "Nothing’s Off-Limits",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("language")?.value || "en";
  // Load locale messages dynamically from new single-layer JSON files
  const messages = (await import(`../../locales/${lang}.json`)).default;
  void messages; // keep for potential future use
  return (
    <html lang={lang} className={`scroll-smooth ${pressStart2P.variable}`} suppressHydrationWarning>
      <body
        className="pt-24 antialiased bg-black text-white selection:bg-emerald-400Selection:text-black"
        suppressHydrationWarning
      >
        <Providers>
          <CartProvider>
            <NextIntlClientProvider locale={lang} messages={messages}>
              <AnalyticsProvider>
                <Navbar />
                <AnalyticsScripts />
                <main>{children}</main>
                <Footer />
                <CookieBanner />
              </AnalyticsProvider>
            </NextIntlClientProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
