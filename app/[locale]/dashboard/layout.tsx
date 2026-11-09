import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Account } from "../../api-client";
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

  const authHref = `/${locale}/auth`;
  const token = (await cookies()).get("mono_session")?.value;
  if (!token) redirect(authHref);
  const origin = (process.env.DIGEST_API_URL || "http://backend:8080").replace(/\/+$/, "");
  const response = await fetch(origin + "/api/v1/auth/me", {
    headers: { Cookie: `mono_session=${token}` }, cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 401 || response.status === 403) redirect(authHref);
  if (!response.ok) throw new Error("Не удалось загрузить аккаунт. Попробуйте позже.");
  const { user } = await response.json() as { user: Account };

  const baseHref = locale === defaultLocale ? "/dashboard" : `/${locale}/dashboard`;
  return <Dashboard baseHref={baseHref} homeHref={localePath(locale)} account={user} authHref={authHref}>{children}</Dashboard>;
}
