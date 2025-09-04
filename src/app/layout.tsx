import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { CartProvider } from "@/context/CartContext";
import CookieBanner from "../components/CookieBanner";
import AnalyticsScripts from "../components/AnalyticsScripts";
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
    <html lang={lang} className="scroll-smooth" suppressHydrationWarning>
      <body
        className={ "pt-24 antialiased"}
      >
        <Providers>
          <CartProvider>
            <NextIntlClientProvider locale={lang} messages={messages}>
              <Navbar/>
              <AnalyticsScripts />
              <main>{children}</main>
              <Footer/>
              <CookieBanner />
            </NextIntlClientProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
