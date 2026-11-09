"use client";

import { useEffect, useState, type FormEvent } from "react";
import { EnvelopeSimple, MagnifyingGlass, Plus, Trash, UsersThree } from "@phosphor-icons/react";
import { apiRequest, type Recipient } from "../../api-client";
import { DashboardSelect } from "./dashboard-select";
import "./mailing.css";

const statuses = { send: "Отправлять", skip: "Не отправлять" } as const;
type Status = keyof typeof statuses;
const statusKeys = Object.keys(statuses) as Status[];
const statusOptions = statusKeys.map((key) => ({ value: key, label: statuses[key] }));
const filterOptions = [{ value: "" as const, label: "Все статусы" }, ...statusOptions];

async function saveRecipientStatus(id: string, status: Status) {
  const { recipient } = await apiRequest<{ recipient: Recipient }>(
    "recipients/" + encodeURIComponent(id), "PATCH", { status },
  );
  return recipient;
}

export function MailingList() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("send");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Status | "">("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ recipients: Recipient[] }>("recipients", "GET", undefined, controller.signal)
      .then(data => setRecipients(data.recipients || []))
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Не удалось загрузить получателей."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function reload() {
    setLoading(true); setError("");
    try { setRecipients((await apiRequest<{ recipients: Recipient[] }>("recipients")).recipients || []); }
    catch (error) { setError(error instanceof Error ? error.message : "Не удалось загрузить получателей."); }
    finally { setLoading(false); }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || loading) return;
    const emails = email.split(/[\s,;]+/).map(value => value.trim().toLowerCase()).filter(Boolean);
    if (!emails.length || emails.some(value => value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) { setError("Введите корректные адреса электронной почты."); return; }
    if (new Set(emails).size !== emails.length || emails.some(value => recipients.some(item => item.email.toLowerCase() === value))) { setError("Один из адресов уже есть в списке или повторяется."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const body = emails.length === 1 ? { email: emails[0], status } : { emails, status };
      const data = await apiRequest<{ recipients: Recipient[] }>("recipients", "POST", body);
      setRecipients(current => [...current, ...data.recipients]);
      setEmail(""); setQuery(""); setFilter("");
      setNotice(emails.length === 1 ? "Адрес добавлен в ваш список." : `Добавлено адресов: ${data.recipients.length}.`);
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось добавить адрес."); }
    finally { setBusy(false); }
  }

  async function update(item: Recipient, next: Status) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const recipient = await saveRecipientStatus(item.id, next);
      setRecipients(current => current.map(row => row.id === item.id ? recipient : row));
      setNotice("Статус для " + item.email + " сохранён.");
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось изменить статус."); }
    finally { setBusy(false); }
  }

  async function updateAll(next: Status) {
    const pending = recipients.filter((recipient) => recipient.status !== next);
    if (busy || loading || !pending.length) return;
    setBusy(true);
    setError("");
    setNotice("");

    const updated = new Map<string, Recipient>();
    try {
      for (let index = 0; index < pending.length; index += 4) {
        const results = await Promise.allSettled(
          pending.slice(index, index + 4).map(({ id }) => saveRecipientStatus(id, next)),
        );
        for (const result of results) {
          if (result.status === "fulfilled") updated.set(result.value.id, result.value);
        }
      }

      setRecipients((current) => current.map((recipient) => updated.get(recipient.id) ?? recipient));
      const failed = pending.length - updated.size;
      if (failed) {
        setError(`Не удалось обновить ${failed} из ${pending.length} адресов. Повторите действие для оставшихся.`);
      } else {
        setNotice(`Статус «${statuses[next]}» установлен для всех получателей.`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Recipient) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await apiRequest("recipients/" + encodeURIComponent(item.id), "DELETE");
      setRecipients(current => current.filter(row => row.id !== item.id));
      setNotice("Адрес " + item.email + " удалён.");
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось удалить адрес."); }
    finally { setBusy(false); }
  }

  const visible = recipients.filter(item => (!filter || item.status === filter) && item.email.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="mailing">
    <section className="dash-panel mailing-add" aria-labelledby="mailing-add-title">
      <div className="dash-panel-head"><h2 id="mailing-add-title"><Plus size={18} aria-hidden="true" /> Добавить получателя</h2></div>
      <form className="mailing-form" onSubmit={add}>
        <label>Электронная почта<input className="dash-input" type="text" inputMode="email" autoComplete="off" placeholder="name@company.ru" required disabled={busy || loading} value={email} onChange={event => { setEmail(event.target.value); setError(""); }} aria-describedby="mailing-email-help" /></label>
        <DashboardSelect label="Статус" showLabel options={statusOptions} value={status} disabled={busy || loading} onChange={setStatus} />
        <button type="submit" className="dash-button dash-button-primary" disabled={busy || loading || !email.trim()}><Plus size={17} aria-hidden="true" /> {busy ? "Сохраняем…" : "Добавить адрес"}</button>
      </form>
      <p className="mailing-help" id="mailing-email-help" style={{ marginTop: 10 }}>Несколько адресов можно разделить запятой, пробелом или точкой с запятой.</p>
    </section>
    <section className="dash-panel mailing-list" aria-labelledby="mailing-list-title">
      <div className="dash-panel-head mailing-heading"><h2 id="mailing-list-title"><UsersThree size={18} aria-hidden="true" /> Получатели <span className="mailing-total">{recipients.length}</span></h2><span className="mailing-saved">Список вашего аккаунта</span></div>
      {error && <p className="dash-error" role="alert">{error} <button className="dash-text-button" type="button" disabled={busy || loading} onClick={reload}>Обновить список</button></p>}
      <div className="dash-inline mailing-bulk" role="group" aria-label="Статус всех получателей">
        <button className="dash-button" type="button" disabled={busy || loading || !recipients.some((item) => item.status === "skip")} onClick={() => void updateAll("send")}>
          Отправлять всем
        </button>
        <button className="dash-button" type="button" disabled={busy || loading || !recipients.some((item) => item.status === "send")} onClick={() => void updateAll("skip")}>
          Не отправлять
        </button>
      </div>
      {recipients.length > 0 && <div className="mailing-tools"><label className="mailing-search"><MagnifyingGlass size={17} aria-hidden="true" /><input className="dash-input" type="search" placeholder="Найти адрес" aria-label="Найти адрес" value={query} onChange={event => setQuery(event.target.value)} /></label><DashboardSelect label="Фильтр по статусу" options={filterOptions} value={filter} onChange={setFilter} /></div>}
      {loading ? <p className="mailing-empty" role="status">Загружаем список…</p> : recipients.length === 0 ? <div className="mailing-empty"><EnvelopeSimple size={32} aria-hidden="true" /><h3>Добавьте первый адрес</h3><p>Сохраните получателей, чтобы отправлять им готовые дайджесты.</p></div> : visible.length === 0 ? <div className="mailing-empty"><p>Подходящих адресов не найдено.</p><button className="dash-text-button" type="button" onClick={() => { setQuery(""); setFilter(""); }}>Сбросить фильтры</button></div> : <div className="mailing-table-wrap"><table className="mailing-table"><thead><tr><th scope="col">Электронная почта</th><th scope="col">Статус отправки</th><th scope="col"><span className="mailing-sr-only">Действия</span></th></tr></thead><tbody>{visible.map(item => <tr key={item.id}>
        <td><span className="mailing-address"><EnvelopeSimple size={17} aria-hidden="true" /><span>{item.email}</span></span></td>
        <td><div className="mailing-mode" data-mode={item.status === "send" ? "all" : "none"}><span className="mailing-dot" /><DashboardSelect label={"Статус для " + item.email} options={statusOptions} value={item.status} disabled={busy} onChange={(next) => void update(item, next)} /></div></td>
        <td><button className="mailing-remove" type="button" title="Удалить адрес" aria-label={"Удалить " + item.email} disabled={busy} onClick={() => remove(item)}><Trash size={18} aria-hidden="true" /></button></td>
      </tr>)}</tbody></table></div>}
      <p className="mailing-notice" role="status" aria-live="polite">{notice}</p>
    </section>
  </div>;
}
