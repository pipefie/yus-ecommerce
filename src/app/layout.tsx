import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { CartProvider } from "@/context/CartContext";
import CookieBanner from "../components/CookieBanner";
import AnalyticsScripts from "../components/AnalyticsScripts";
import { cookies } from "next/headers";

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
  return (
    <html lang={lang} className="scroll-smooth">
      <body
        className={ "pt-24 antialiased"}
      >
        <Providers>
          <CartProvider>
            <Navbar/>
            <AnalyticsScripts />
            <main>{children}</main>
            <Footer/>
            <CookieBanner />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
