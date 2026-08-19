import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tvoyasuchka.vercel.app"),
  title: "TvoyaAIbot — твой AI-компаньон",
  description: "Telegram-first AI companion с отношениями, памятью и прозрачной оплатой Stars.",
  openGraph: {
    title: "TvoyaAIbot — твой AI-компаньон",
    description: "Знакомься, общайся и развивай отношения в Telegram.",
    images: [{ url: "/og.png", width: 1672, height: 943, alt: "TvoyaAIbot" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
