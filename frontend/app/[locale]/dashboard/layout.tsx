import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { defaultLocale, isLocale, localePath } from "../../locales";
import { Dashboard } from "./dashboard";
import "./dashboard.css";

export default async function DashboardLayout({
  children, params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const baseHref = locale === defaultLocale ? "/dashboard" : `/${locale}/dashboard`;
  return <Dashboard baseHref={baseHref} homeHref={localePath(locale)}>{children}</Dashboard>;
}
