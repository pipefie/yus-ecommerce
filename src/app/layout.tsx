import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { CartProvider } from "@/context/CartContext";

export const metadata = {
  title: "Y-US? Store",
  description: "Nothing’s Off-Limits",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={ "pt-24 antialiased"}
      >
        <Providers>
          <CartProvider>
            <Navbar/>
            <main>{children}</main>
            <Footer/>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
