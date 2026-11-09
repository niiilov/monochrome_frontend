"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { apiRequest, ApiError, type Account } from "./api-client";

const blankCode = () => Array<string>(6).fill("");

export function AuthForm({ dashboardHref, initialSignIn }: { dashboardHref: string; initialSignIn: boolean }) {
  const [step, setStep] = useState<"details" | "code" | "verified">("details");
  const [signIn, setSignIn] = useState(initialSignIn);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(blankCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fields = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => { if (step === "code") fields.current[0]?.focus(); }, [step]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    const address = email.trim().toLowerCase();
    setEmail(address);
    try {
      if (signIn) {
        await apiRequest<{ user: Account }>("auth/login", "POST", { email: address, password });
        setPassword("");
        window.location.assign(dashboardHref);
      } else {
        await apiRequest("auth/register", "POST", { email: address, password, name: name.trim() });
        setPassword(""); setCode(blankCode()); setStep("code");
        setNotice("Код подтверждения отправлен на почту. Проверьте входящие и папку «Спам».");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось выполнить запрос.");
      if (signIn && error instanceof ApiError && error.status === 403) { setCode(blankCode()); setStep("code"); }
    } finally { setBusy(false); }
  }

  function enterDigits(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    const start = digits.length === 6 ? 0 : index;
    const next = [...code];
    if (!digits) next[index] = "";
    else digits.slice(0, 6 - start).split("").forEach((digit, offset) => { next[start + offset] = digit; });
    setCode(next); setError("");
    if (digits) fields.current[Math.min(start + digits.length, 5)]?.focus();
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !code.every(Boolean)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await apiRequest("auth/verify-email", "POST", { email, code: code.join("") });
      setPassword(""); setCode(blankCode()); setStep("verified");
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось подтвердить почту."); }
    finally { setBusy(false); }
  }

  async function resend() {
    if (busy || !email.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await apiRequest<{ message: string }>("auth/resend-verification", "POST", { email: email.trim().toLowerCase() });
      setEmail(email.trim().toLowerCase()); setCode(blankCode()); setStep("code");
      setNotice(response.message); fields.current[0]?.focus();
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось отправить новый код."); }
    finally { setBusy(false); }
  }

  return <div className={`auth-card${step === "verified" ? " auth-success" : ""}`}>
    {step === "verified" ? <>
      <h1>Почта подтверждена</h1>
      <p className="auth-description">Теперь можно войти с адресом <b>{email}</b> и паролем. Повторно подтверждать почту при входе не потребуется.</p>
      <button className="auth-primary" type="button" onClick={() => { setSignIn(true); setStep("details"); setError(""); setNotice(""); }}>Войти в аккаунт</button>
    </> : step === "code" ? <>
      <h1>Введите код</h1>
      <p className="auth-description">Шестизначный код для <b>{email}</b></p>
      <form className="auth-verify" onSubmit={verify}>
        <div className="auth-code" role="group" aria-label="Код подтверждения">{code.map((value, index) => <Fragment key={index}>
          {index === 3 && <span className="auth-code-separator" aria-hidden="true">–</span>}
          <input ref={node => { fields.current[index] = node; }} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} disabled={busy} aria-label={`Цифра ${index + 1}`} aria-invalid={!!error || undefined} aria-describedby="auth-code-help" value={value}
            onFocus={event => event.currentTarget.select()} onChange={event => enterDigits(index, event.target.value)}
            onPaste={event => { event.preventDefault(); enterDigits(index, event.clipboardData.getData("text")); }}
            onKeyDown={event => { if (event.key === "Backspace" && !value) fields.current[index - 1]?.focus(); }} />
        </Fragment>)}</div>
        <button className="auth-primary" type="submit" disabled={busy || !code.every(Boolean)}>{busy ? "Подождите…" : "Подтвердить почту"}</button>
      </form>
      <p className="auth-helper" id="auth-code-help">Код действует 15 минут. После пяти неверных попыток запросите новый код.</p>
      <div className="auth-code-actions"><button type="button" disabled={busy} onClick={() => { setSignIn(true); setStep("details"); setPassword(""); setError(""); setNotice(""); }}>Назад ко входу</button><button type="button" disabled={busy} onClick={resend}>Отправить код ещё раз</button></div>
    </> : <>
      <h1>{signIn ? "Войдите в аккаунт" : "Создайте аккаунт"}</h1>
      <p className="auth-description">{signIn ? "Введите почту и пароль." : "Укажите данные. Мы отправим на почту код подтверждения."}</p>
      <form className="auth-form" onSubmit={submit}>
        {!signIn && <label>Имя<input name="name" autoComplete="name" required maxLength={100} disabled={busy} value={name} onChange={event => setName(event.target.value)} placeholder="Как к вам обращаться" /></label>}
        <label>Электронная почта<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Пароль<input name="password" type="password" autoComplete={signIn ? "current-password" : "new-password"} required minLength={signIn ? undefined : 8} disabled={busy} value={password} onChange={event => setPassword(event.target.value)} placeholder={signIn ? "Ваш пароль" : "Минимум 8 символов"} /></label>
        <button className="auth-primary" type="submit" disabled={busy}>{busy ? "Подождите…" : signIn ? "Войти" : "Зарегистрироваться"}</button>
      </form>
      <p className="auth-switch">{signIn ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}<button type="button" disabled={busy} onClick={() => { setSignIn(!signIn); setPassword(""); setError(""); setNotice(""); }}>{signIn ? "Зарегистрироваться" : "Войти"}</button></p>
    </>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-notice" role="status">{notice}</p>}
  </div>;
}
