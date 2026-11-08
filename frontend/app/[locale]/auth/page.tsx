import { notFound } from "next/navigation";
import { AuthForm } from "../../auth-form";
import { HeroMotion } from "../../hero-motion";
import { isLocale, localePath } from "../../locales";

type Props = { params: Promise<{ locale: string }> };

export const metadata = { title: "MONO · Вход и регистрация" };

export default async function AuthPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const backHref = localePath(locale);

  return (
    <main className="auth-page" lang="ru" dir="ltr">
      <section className="auth-stage" aria-label="Авторизация MONO">
        <header className="auth-stage-head">
          <a className="brand" href={backHref}><img src="/icon.svg" alt="" width="27" height="27" />MONO</a>
          <a href={backHref}>На главную <span aria-hidden="true">↗</span></a>
        </header>
        <div className="auth-scene"><HeroMotion emphasis={1} /></div>
        <div className="auth-intro">
          <p className="auth-intro-title">Ваш аккаунт в MONO</p>
          <p>Создайте аккаунт или войдите, чтобы продолжить.</p>
        </div>
        <AuthForm dashboardHref={`/${locale}/dashboard`} />
      </section>
    </main>
  );
}
