import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { GlobalSessionListener } from "@/components/shared/GlobalSessionListener";

export const metadata: Metadata = {
  title: "DMart - Self Checkout & Smart Exit",
  description: "Seamless in-store shopping experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <GlobalSessionListener />
              {children}
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
