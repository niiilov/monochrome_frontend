import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "@fontsource-variable/manrope";
import "../globals.css";
import { isLocale, locales } from "../locales";
import { initializeTheme } from "../theme";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale === "zh" ? "zh-Hans" : locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: initializeTheme }} /></head>
      <body>{children}</body>
    </html>
  );
}
