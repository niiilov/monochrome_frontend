"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { readDemoAccount, saveDemoAccount } from "./demo-account";

const demoCode = "123456";
const emptyCode = Array<string>(6).fill("");
const providers = ["Google", "Яндекс ID"] as const;

function ProviderIcon({ provider }: { provider: typeof providers[number] }) {
  if (provider === "Яндекс ID") return <span className="auth-yandex-icon" aria-hidden="true">Я</span>;
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285f4" d="M43.61 24.46c0-1.36-.12-2.67-.34-3.92H24v7.42h11.02a9.42 9.42 0 0 1-4.09 6.18v5.14h6.62c3.87-3.57 6.06-8.83 6.06-14.82Z" />
      <path fill="#34a853" d="M24 44c5.51 0 10.13-1.83 13.52-4.96l-6.62-5.14c-1.83 1.23-4.18 1.97-6.9 1.97-5.33 0-9.85-3.6-11.47-8.45H5.7v5.3A20 20 0 0 0 24 44Z" />
      <path fill="#fbbc05" d="M12.53 27.42a12.02 12.02 0 0 1 0-6.84v-5.3H5.7a20 20 0 0 0 0 17.44l6.83-5.3Z" />
      <path fill="#ea4335" d="M24 12.13c3 0 5.69 1.03 7.81 3.06l5.86-5.86A19.23 19.23 0 0 0 24 4 20 20 0 0 0 5.7 15.28l6.83 5.3c1.62-4.85 6.14-8.45 11.47-8.45Z" />
    </svg>
  );
}

export function AuthForm({ dashboardHref }: { dashboardHref: string }) {
  const [step, setStep] = useState<"details" | "code" | "done">("details");
  const [signIn, setSignIn] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(emptyCode);
  const [incorrect, setIncorrect] = useState(false);
  const [notice, setNotice] = useState("");
  const fields = useRef<Array<HTMLInputElement | null>>([]);
  const successHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (step === "code") fields.current[0]?.focus();
    if (step === "done") successHeading.current?.focus();
  }, [step]);

  function resetCode() {
    setCode(emptyCode);
    setIncorrect(false);
  }

  function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetCode();
    setNotice("");
    setStep("code");
  }

  function enterDigits(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    const start = digits.length === 6 ? 0 : index;
    const next = [...code];
    if (!digits) next[index] = "";
    else digits.slice(0, 6 - start).split("").forEach((digit, offset) => {
      next[start + offset] = digit;
    });
    setCode(next);
    setIncorrect(false);
    if (digits) fields.current[Math.min(start + digits.length, 5)]?.focus();
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.every(Boolean)) return;
    if (code.join("") !== demoCode) {
      setIncorrect(true);
      return;
    }
    const previous = readDemoAccount();
    const address = email.trim();
    saveDemoAccount({ name: signIn && previous?.email === address ? previous.name : name.trim(), email: address });
    setStep("done");
  }

  return (
    <div className={`auth-card${step === "done" ? " auth-success" : ""}`}>
      {step === "done" ? (
        <>
          <h1 ref={successHeading} tabIndex={-1}>Код принят</h1>
          <p className="auth-description">Проверка адреса <b>{email}</b> пройдена в деморежиме.</p>
          <a className="auth-primary" href={dashboardHref}>Перейти в дашборд</a>
        </>
      ) : step === "code" ? (
        <>
          <h1>Введите код</h1>
          <p className="auth-description">Шестизначный код для <b>{email}</b></p>
          <form className="auth-verify" onSubmit={verify}>
            <div className="auth-code" role="group" aria-label="Код подтверждения">
              {code.map((value, index) => (
                <Fragment key={index}>
                  {index === 3 && <span className="auth-code-separator" aria-hidden="true">–</span>}
                  <input
                    ref={(node) => { fields.current[index] = node; }}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Цифра ${index + 1}`}
                    aria-invalid={incorrect || undefined}
                    aria-describedby={incorrect ? "auth-code-error" : "auth-demo-code"}
                    value={value}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => enterDigits(index, event.target.value)}
                    onPaste={(event) => {
                      event.preventDefault();
                      enterDigits(index, event.clipboardData.getData("text"));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !value) fields.current[index - 1]?.focus();
                    }}
                  />
                </Fragment>
              ))}
            </div>
            {incorrect && <p className="auth-error" id="auth-code-error" role="alert">Неверный код. Проверьте цифры и попробуйте ещё раз.</p>}
            <button className="auth-primary" type="submit" disabled={!code.every(Boolean)}>Подтвердить код</button>
          </form>
          <p className="auth-helper" id="auth-demo-code">Демокод <b>{demoCode}</b></p>
          <div className="auth-code-actions">
            <button type="button" onClick={() => { setNotice(""); setStep("details"); }}>Изменить почту</button>
            <button type="button" onClick={() => {
              resetCode();
              setNotice(`Повторная отправка в деморежиме. Код ${demoCode}.`);
              fields.current[0]?.focus();
            }}>Запросить код ещё раз</button>
          </div>
        </>
      ) : (
        <>
          <h1>{signIn ? "Войдите в аккаунт" : "Создайте аккаунт"}</h1>
          <p className="auth-description">{signIn ? "Введите почту и пароль, чтобы перейти к подтверждению." : "Укажите данные и подтвердите почту."}</p>
          <form className="auth-form" onSubmit={sendCode}>
            {!signIn && (
              <label>Имя
                <input name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Как к вам обращаться" />
              </label>
            )}
            <label>Электронная почта
              <input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <label>Пароль
              <input
                key={signIn ? "current-password" : "new-password"}
                id="auth-password"
                type="password"
                autoComplete={signIn ? "current-password" : "new-password"}
                required
                placeholder={signIn ? "Ваш пароль" : "Придумайте пароль"}
              />
            </label>
            <button className="auth-primary" type="submit">Получить код</button>
          </form>
          <div className="auth-divider"><span>или</span></div>
          <div className="auth-providers">
            {providers.map((provider) => (
              <button className="auth-provider" key={provider} type="button" onClick={() => setNotice(`Вход через ${provider} доступен после подключения сервиса авторизации.`)}>
                <ProviderIcon provider={provider} />Продолжить с {provider}
              </button>
            ))}
          </div>
          <p className="auth-switch">{signIn ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button type="button" onClick={() => { setNotice(""); setSignIn(!signIn); }}>{signIn ? "Зарегистрироваться" : "Войти"}</button>
          </p>
        </>
      )}
      {notice && <p className="auth-notice" role="status">{notice}</p>}
    </div>
  );
}
