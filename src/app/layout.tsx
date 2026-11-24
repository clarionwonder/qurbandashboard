import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { isDemo } from "@/lib/env";
import { getI18n, getTheme } from "@/lib/i18n/server";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: { default: "GERMY Qurban", template: "%s · GERMY Qurban" },
  description: "Qurban & aqiqah · GERMY",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getI18n();
  const theme = await getTheme();
  return (
    <html lang={lang} className={theme === "system" ? undefined : theme}>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        {isDemo && (
          <div className="no-print bg-gold-500 px-4 py-1.5 text-center text-xs font-semibold text-brand-900">{t.demoBanner}</div>
        )}
        {children}
      </body>
    </html>
  );
}
