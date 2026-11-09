"use client";

import { Globe, PencilSimple, Plus, Question, Trash } from "@phosphor-icons/react";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { ApiError, apiRequest } from "../../api-client";
import { DashboardSelect } from "./dashboard-select";
import "./sources.css";

type SourceKind = "rss" | "html" | "api";
type NewsSource = {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  enabled: boolean;
  fetch: boolean;
  article: string;
  item: string;
  title: string;
  link: string;
  date: string;
  text: string;
  items: string;
};

type Draft = Omit<NewsSource, "id">;

const kinds: { value: SourceKind; label: string }[] = [
  { value: "rss", label: "RSS" },
  { value: "html", label: "HTML" },
  { value: "api", label: "API" },
];

const emptyDraft: Draft = {
  name: "",
  kind: "rss",
  url: "",
  enabled: true,
  fetch: true,
  article: "",
  item: "",
  title: "",
  link: "",
  date: "",
  text: "",
  items: "",
};

function draftFrom(source: NewsSource): Draft {
  return {
    name: source.name,
    kind: source.kind,
    url: source.url,
    enabled: source.enabled,
    fetch: source.fetch,
    article: source.article,
    item: source.item,
    title: source.title,
    link: source.link,
    date: source.date,
    text: source.text,
    items: source.items,
  };
}

function SourceFieldHelp({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="sources-field-help"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setVisible(true); }}
      onPointerLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setVisible(false); }}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={(event) => { event.currentTarget.focus(); setVisible(true); }}
        onKeyDown={(event) => { if (event.key === "Escape") setVisible(false); }}
      >
        <Question size={16} aria-hidden="true" />
      </button>
      <span id={id} className="sources-tooltip" role="tooltip" hidden={!visible}>{children}</span>
    </span>
  );
}

export function SourcesPanel() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ sources: NewsSource[] }>("sources", "GET", undefined, controller.signal)
      .then((data) => setSources(data.sources || []))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Не удалось загрузить источники.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function setField<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function beginEdit(source: NewsSource) {
    setEditing(source.id);
    setDraft(draftFrom(source));
    setError("");
    setNotice("");
  }

  function cancelEdit() {
    setEditing(null);
    setDraft(emptyDraft);
    setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (editing) {
        const data = await apiRequest<{ source: NewsSource }>("sources/" + encodeURIComponent(editing), "PATCH", draft);
        setSources((current) => current.map((item) => (item.id === editing ? data.source : item)));
        setNotice("Источник обновлён.");
        cancelEdit();
      } else {
        const data = await apiRequest<{ source: NewsSource }>("sources", "POST", draft);
        setSources((current) => [...current, data.source]);
        setDraft(emptyDraft);
        setNotice("Источник добавлен.");
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось сохранить источник.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(source: NewsSource) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest<{ source: NewsSource }>("sources/" + encodeURIComponent(source.id), "PATCH", {
        ...draftFrom(source),
        enabled: !source.enabled,
      });
      setSources((current) => current.map((item) => (item.id === source.id ? data.source : item)));
      if (editing === source.id) setDraft(draftFrom(data.source));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось изменить источник.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(source: NewsSource) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest("sources/" + encodeURIComponent(source.id), "DELETE");
      setSources((current) => current.filter((item) => item.id !== source.id));
      if (editing === source.id) cancelEdit();
      setNotice("Источник удалён.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось удалить источник.");
    } finally {
      setBusy(false);
    }
  }

  const enabledCount = sources.filter((item) => item.enabled).length;

  return (
    <div className="sources">
      <section className="dash-panel" aria-labelledby="sources-form-title">
        <div className="dash-panel-head">
          <h2 id="sources-form-title">
            {editing ? <PencilSimple size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
            {editing ? "Изменить источник" : "Добавить источник"}
          </h2>
        </div>
        <form className="sources-form" onSubmit={save}>
          <label>
            Название
            <input className="dash-input" required maxLength={80} disabled={busy || loading} value={draft.name} onChange={(event) => setField("name", event.target.value)} />
          </label>
          <div className="sources-kind">
            <div className="sources-field-label">
              <span>Тип</span>
              <SourceFieldHelp label="Что означает тип источника">
                RSS — готовая лента новостей. HTML — страница сайта со списком публикаций. API — адрес, который возвращает список в JSON.
              </SourceFieldHelp>
            </div>
            <DashboardSelect label="Тип источника" options={kinds} value={draft.kind} disabled={busy || loading} onChange={(kind) => setField("kind", kind)} />
          </div>
          <label className="sources-url">
            Адрес
            <input className="dash-input" type="url" required disabled={busy || loading} placeholder="https://example.com/feed" value={draft.url} onChange={(event) => setField("url", event.target.value)} />
          </label>
          <label className="sources-check">
            <input
              type="checkbox"
              checked={draft.enabled}
              disabled={busy || loading}
              aria-labelledby="source-enabled-label"
              aria-describedby="source-enabled-help"
              onChange={(event) => setField("enabled", event.target.checked)}
            />
            <span>
              <span id="source-enabled-label">Использовать источник при сборе</span>
              <small id="source-enabled-help">MONO будет брать публикации из этого источника в режиме «С сайтов».</small>
            </span>
          </label>
          <label className="sources-check">
            <input
              type="checkbox"
              checked={draft.fetch}
              disabled={busy || loading}
              aria-labelledby="source-fetch-label"
              aria-describedby="source-fetch-help"
              onChange={(event) => setField("fetch", event.target.checked)}
            />
            <span>
              <span id="source-fetch-label">Загружать текст со страницы новости</span>
              <small id="source-fetch-help">Если в источнике только короткое описание, MONO попробует получить больше текста по ссылке на новость.</small>
            </span>
          </label>
          <div className="sources-field">
            <div className="sources-field-label">
              <label htmlFor="source-article-selector">Селектор текста</label>
              <SourceFieldHelp label="Что такое селектор текста">
                CSS-селектор блока с полным текстом новости на её странице, например <code>article</code> или <code>.field-name-body</code>. Поле можно оставить пустым.
              </SourceFieldHelp>
            </div>
            <input id="source-article-selector" className="dash-input" maxLength={200} disabled={busy || loading} placeholder=".field-name-body" value={draft.article} onChange={(event) => setField("article", event.target.value)} />
          </div>
          {draft.kind === "html" && (
            <>
              <label>Блок записи<input className="dash-input" maxLength={200} disabled={busy || loading} value={draft.item} onChange={(event) => setField("item", event.target.value)} /></label>
              <label>Заголовок<input className="dash-input" maxLength={200} disabled={busy || loading} value={draft.title} onChange={(event) => setField("title", event.target.value)} /></label>
              <label>Ссылка<input className="dash-input" maxLength={200} disabled={busy || loading} value={draft.link} onChange={(event) => setField("link", event.target.value)} /></label>
              <label>Дата<input className="dash-input" maxLength={200} disabled={busy || loading} value={draft.date} onChange={(event) => setField("date", event.target.value)} /></label>
              <label>Текст в списке<input className="dash-input" maxLength={200} disabled={busy || loading} value={draft.text} onChange={(event) => setField("text", event.target.value)} /></label>
            </>
          )}
          {draft.kind === "api" && (
            <label>
              Путь к списку
              <input className="dash-input" maxLength={200} disabled={busy || loading} placeholder="items" value={draft.items} onChange={(event) => setField("items", event.target.value)} />
            </label>
          )}
          <div className="sources-actions">
            <button className="dash-button dash-button-primary" type="submit" disabled={busy || loading}>
              {editing ? "Сохранить" : "Добавить"}
            </button>
            {editing && (
              <button className="dash-text-button" type="button" disabled={busy} onClick={cancelEdit}>Отмена</button>
            )}
          </div>
        </form>
        {error && <p className="dash-error" role="alert">{error}</p>}
      </section>

      <section className="dash-panel" aria-labelledby="sources-list-title">
        <div className="dash-panel-head sources-heading">
          <h2 id="sources-list-title"><Globe size={18} aria-hidden="true" /> Источники <span className="sources-total">{sources.length}</span></h2>
          <span className="sources-saved">Включено {enabledCount} · список вашего аккаунта</span>
        </div>
        {loading ? <p className="sources-empty" role="status">Загружаем источники…</p> : sources.length === 0 ? (
          <div className="sources-empty">
            <Globe size={32} aria-hidden="true" />
            <h3>Список пуст</h3>
            <p>Добавьте RSS, страницу или API. Без включённого источника сбор с сайтов не запустится.</p>
          </div>
        ) : (
          <div className="sources-table-wrap">
            <table className="sources-table">
              <thead>
                <tr>
                  <th scope="col">Источник</th>
                  <th scope="col">Тип</th>
                  <th scope="col">Сбор</th>
                  <th scope="col"><span className="sources-sr-only">Действия</span></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <strong>{source.name}</strong>
                      <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
                    </td>
                    <td>{kinds.find((item) => item.value === source.kind)?.label ?? source.kind}</td>
                    <td>
                      <button className="sources-toggle" type="button" aria-pressed={source.enabled} disabled={busy} onClick={() => void toggle(source)}>
                        {source.enabled ? "Включён" : "Выключен"}
                      </button>
                    </td>
                    <td className="sources-row-actions">
                      <button className="dash-button" type="button" disabled={busy} onClick={() => beginEdit(source)}>Изменить</button>
                      <button className="sources-remove" type="button" aria-label={"Удалить " + source.name} disabled={busy} onClick={() => void remove(source)}>
                        <Trash size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="sources-notice" role="status" aria-live="polite">{notice}</p>
      </section>
    </div>
  );
}
