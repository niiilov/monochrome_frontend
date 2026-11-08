"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Article,
  ArrowClockwise,
  ArrowRight,
  ArrowSquareOut,
  BookOpen,
  CaretDown,
  CaretRight,
  Check,
  Clock,
  CloudArrowUp,
  Copy,
  DotsThree,
  DownloadSimple,
  EnvelopeSimple,
  FileText,
  ListChecks,
  MagnifyingGlass,
  Moon,
  PaperPlaneTilt,
  Play,
  Plus,
  ShieldCheck,
  SignOut,
  SquaresFour,
  Sun,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { readDemoAccount, saveDemoAccount } from "../../demo-account";
import { toggleTheme } from "../../theme";
import { DashboardGuide, PageHint } from "./dashboard-guide";
import {
  LatestIssue,
  RunStatistics,
  RunStatusChart,
} from "./dashboard-overview";
import {
  addArticle,
  checkSend,
  createRun,
  exportUrl,
  finishPendingRun,
  getPeriod,
  getRunStatus,
  lastRunKey,
  loadRun,
  pendingRunKey,
  readRunId,
  sampleControlTime,
  sampleDataset,
  storeRunId,
  uploadLimit,
  type ArticleDraft,
  type DigestRun,
  type RunStatus,
  type Status,
} from "./digest-api";
import { dashboardSections, type DashboardSection } from "./sections";

const materials = [
  { id: "digest", icon: Article },
  { id: "post", icon: FileText },
  { id: "email", icon: EnvelopeSimple },
] as const;
const review = [
  { id: "journal", icon: ListChecks },
  { id: "report", icon: ShieldCheck },
] as const;
const resultGroups = [
  { label: "Материалы выпуска", items: materials },
  { label: "Проверка обработки", items: review },
];

type ResultSection = (typeof materials | typeof review)[number]["id"];

const stageLabels: Record<string, string> = {
  load: "Загрузка публикаций",
  normalize: "Нормализация",
  period: "Проверка периода",
  guard: "Проверка входных данных",
  topic: "Отбор по теме",
  extract: "Извлечение фактов",
  cluster: "Объединение публикаций",
  rank: "Ранжирование",
  select: "Отбор событий",
  summarize: "Подготовка текстов",
  verify: "Сверка фактов",
  write: "Запись файлов",
};
const statuses: Status[] = ["включён", "объединён", "исключён"];
const statusClasses: Record<Status, string> = {
  включён: "included",
  объединён: "merged",
  исключён: "excluded",
};
type DialogKind = "export" | "send" | "article";

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dash-dialog"
      onClose={onClose}
      aria-labelledby="dash-dialog-title"
    >
      <header className="dash-dialog-header">
        <h2 id="dash-dialog-title">{title}</h2>
        <button
          type="button"
          className="dash-icon-button"
          aria-label="Закрыть"
          onClick={() => ref.current?.close()}
        >
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

function RunProgress({ status }: { status: RunStatus | null }) {
  const stageList = useRef<HTMLOListElement>(null);
  const followLatest = useRef(true);
  const stages = status?.stages ?? [];
  const current = stages.at(-1);

  useLayoutEffect(() => {
    const list = stageList.current;
    if (list && followLatest.current) list.scrollTop = list.scrollHeight;
  }, [stages.length, current?.name]);

  return (
    <section className="dash-panel dash-progress" aria-labelledby="dash-progress-title">
      <div className="dash-panel-head">
        <h2 id="dash-progress-title">
          <Clock size={17} aria-hidden="true" /> Ход обработки
        </h2>
      </div>
      <progress
        value={status?.status === "done" ? 1 : current?.total ? current.done : undefined}
        max={status?.status === "done" ? 1 : current?.total || 1}
        aria-label="Ход текущего этапа"
      />
      <ol
        ref={stageList}
        tabIndex={0}
        aria-label="Этапы обработки"
        onScroll={(event) => {
          const { scrollHeight, clientHeight, scrollTop } = event.currentTarget;
          followLatest.current = scrollHeight - clientHeight - scrollTop <= 2;
        }}
      >
        {stages.map(({ name, done, total }, index) => {
          const finished = index < stages.length - 1 || status?.status === "done" || (total > 0 && done >= total);
          return (
            <li key={name} data-stage={finished ? "done" : "active"}>
              <span className="dash-stage-mark" aria-hidden="true">
                {finished ? <Check size={12} weight="bold" /> : index + 1}
              </span>
              <span>{stageLabels[name] ?? name}</span>
              <small>{total ? done + " / " + total : finished ? "Готово" : "В работе"}</small>
            </li>
          );
        })}
      </ol>
      <p className="dash-progress-foot" role="status">
        {status?.status === "done" ? "Загружаем результаты…" : current ? "Идёт обработка публикаций" : "Ожидаем ответ сервера…"}
      </p>
    </section>
  );
}

function sourceLink(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {}
}

function EventList({ run }: { run: DigestRun }) {
  return (
    <ol className="dash-events">
      {run.events.map((event, index) => (
        <li className="dash-event" key={event.group}>
          <span className="dash-event-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div className="dash-event-body">
            <h3>{event.title}</h3>
            <dl className="dash-facts">
              <div>
                <dt>Суть</dt>
                <dd>{event.summary}</dd>
              </div>
              <div>
                <dt>Последствия</dt>
                <dd>{event.impact}</dd>
              </div>
              <div>
                <dt>Обоснование</dt>
                <dd>{event.reason}</dd>
              </div>
            </dl>
            <div className="dash-sources" aria-label="Источники">
              {event.sources.map((source) => (
                <a
                  href={sourceLink(source.url)}
                  key={source.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowSquareOut size={13} aria-hidden="true" /> {source.name}
                  <small>
                    {[source.date, source.role, source.id].filter(Boolean).join(" · ")}
                  </small>
                </a>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Journal({ run }: { run: DigestRun }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const term = query.trim().toLowerCase();
  const rows = run.journal.filter(
    (row) =>
      (!status || row.status === status) &&
      [row.id, row.source, row.group, row.reason].some((field) =>
        field.toLowerCase().includes(term),
      ),
  );

  return (
    <div>
      <div className="dash-panel-head dash-result-heading">
        <div>
          <h2>Журнал обработки</h2>
          <p>
            {rows.length} из {run.journal.length} публикаций
          </p>
        </div>
        <div className="dash-journal-controls">
          <label className="dash-search">
            <MagnifyingGlass size={16} aria-hidden="true" />
            <input
              ref={search}
              type="search"
              aria-label="Поиск в журнале"
              placeholder="Источник, ID или причина"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            className="dash-input"
            aria-label="Фильтр по статусу"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Все статусы</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      {rows.length ? (
        <>
          <div
            className="dash-table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Таблица журнала"
          >
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Материал</th>
                  <th scope="col">Статус</th>
                  <th scope="col">Группа</th>
                  <th scope="col">Причина</th>
                  <th scope="col">Ошибка</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id + "-" + row.published_at_msk + "-" + index}>
                    <th scope="row">
                      <small>{row.id}</small>
                      {row.source || "Источник не указан"}
                      {row.published_at_msk && <small>{row.published_at_msk}</small>}
                    </th>
                    <td>
                      <span
                        className={"dash-status " + statusClasses[row.status]}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{row.group || "–"}</td>
                    <td>{row.reason}</td>
                    <td>{row.error || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="dash-journal-list" aria-label="Публикации в журнале">
            {rows.map((row, index) => (
              <li key={row.id + "-" + row.published_at_msk + "-" + index}>
                <div className="dash-panel-head">
                  <strong>{row.source || "Источник не указан"}</strong>
                  <span className={"dash-status " + statusClasses[row.status]}>{row.status}</span>
                </div>
                <small>{[row.id, row.published_at_msk].filter(Boolean).join(" · ")}</small>
                <p>{row.reason}</p>
                {row.group && <small>Группа {row.group}</small>}
                {row.error && <p className="dash-error">Ошибка: {row.error}</p>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="dash-empty-actions">
          <p role="status">{run.journal.length ? "По этим фильтрам публикаций нет." : "В журнале пока нет публикаций."}</p>
          {run.journal.length > 0 && (
            <button type="button" className="dash-button" onClick={() => {
              setQuery("");
              setStatus("");
              search.current?.focus();
            }}>Сбросить фильтры</button>
          )}
        </div>
      )}
    </div>
  );
}

function PostPreview({ run }: { run: DigestRun }) {
  const [notice, setNotice] = useState("");
  const post = run.post;
  const count = Array.from(post.replace(/https?:\/\/[^\s;]+/g, "")).length;
  async function copyPost() {
    try {
      await navigator.clipboard.writeText(post);
      setNotice("Пост скопирован");
    } catch {
      setNotice("Скачайте материалы и откройте post.txt из архива.");
    }
  }

  return (
    <>
      <div className="dash-panel-head dash-result-heading">
        <div>
          <h2>Короткий пост</h2>
          <p>{count} / 2 000 знаков без URL</p>
        </div>
        <button type="button" className="dash-button" onClick={copyPost}>
          <Copy size={16} /> Копировать
        </button>
      </div>
      {notice && (
        <p className="dash-feedback" role="status">
          {notice}
        </p>
      )}
      <pre className="dash-post">{post}</pre>
    </>
  );
}

function RunReport({ run }: { run: DigestRun }) {
  const { report } = run;
  const verification = report.verify.degraded
    ? "Результат требует внимания"
    : run.events.length ? "Проверка завершена" : "Нет событий для сверки";
  return (
    <>
      <div className="dash-result-heading">
        <h2>Отчёт о запуске</h2>
        <p>Сводка по последнему завершённому выпуску</p>
      </div>
      <dl className="dash-report">
        <div>
          <dt>Публикаций обработано</dt>
          <dd>{report.counts.total}</dd>
        </div>
        <div>
          <dt>Событий в выпуске</dt>
          <dd>{run.events.length}</dd>
        </div>
        <div>
          <dt>Время обработки</dt>
          <dd>{(report.duration_ms / 1000).toLocaleString("ru-RU")} с</dd>
        </div>
        <div>
          <dt>Сверка фактов</dt>
          <dd>{verification}</dd>
          {report.verify.findings.length > 0 && (
            <dd>
              <ul>{report.verify.findings.map((finding, index) => <li key={index}>{finding.message}</li>)}</ul>
            </dd>
          )}
        </div>
      </dl>
      <div className="dash-report-stats">
        <RunStatusChart run={run} />
      </div>
      <details className="dash-report-details">
        <summary>
          <CaretDown size={14} aria-hidden="true" /> Технические сведения
        </summary>
        <dl className="dash-report">
          <div>
            <dt>ID запуска</dt>
            <dd>{run.id}</dd>
          </div>
          <div>
            <dt>Модель и версия промптов</dt>
            <dd>{report.llm.provider === "mock" ? "Тестовый режим" : report.llm.model || report.llm.provider || "—"} · {report.prompts_hash.slice(0, 12) || "—"}</dd>
          </div>
          <div>
            <dt>Обращений к модели</dt>
            <dd>{report.llm.calls_total}</dd>
          </div>
          <div>
            <dt>Токены и стоимость</dt>
            <dd>{report.llm.input_tokens + report.llm.output_tokens} / {report.llm.cost ?? "не указана"}</dd>
          </div>
        </dl>
      </details>
    </>
  );
}

function SendForm({ runId }: { runId: string }) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const recipients = value.trim().split(/[\s,;]+/).filter(Boolean);
    if (!recipients.length) {
      setError("Укажите тестовый адрес.");
      return;
    }

    setSending(true);
    setFeedback("");
    setError("");
    try {
      const result = await checkSend(runId, recipients);
      setFeedback("Проверка прошла. Получатели: " + result.recipients.join(", ") + ". Письмо не доставлялось.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось проверить отправку.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="dash-dialog-form" onSubmit={submit}>
      <p>Укажите адрес из списка тестовых получателей, настроенного на сервере. Проверка проходит без доставки письма.</p>
      <label>
        Тестовые получатели
        <input
          className="dash-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setFeedback("");
            setError("");
          }}
          placeholder="test@example.com"
          disabled={sending}
          required
        />
      </label>
      {feedback && <p className="dash-feedback" role="status">{feedback}</p>}
      {error && <p className="dash-error" role="alert">{error}</p>}
      <button type="submit" className="dash-button dash-button-primary" disabled={sending}>
        <PaperPlaneTilt size={16} /> {sending ? "Проверяем…" : "Проверить отправку"}
      </button>
    </form>
  );
}

function ArticleForm({
  run,
  onSubmit,
}: {
  run: DigestRun;
  onSubmit: (article: ArticleDraft) => void;
}) {
  const [draft, setDraft] = useState<ArticleDraft>({
    title: "",
    source: "",
    url: "",
    publishedAt: run.controlTime,
    text: "",
  });
  function field(name: keyof ArticleDraft, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }
  return (
    <form
      className="dash-dialog-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <p>Добавляем публикацию к выпуску из набора <strong>{run.dataset}</strong> за {run.period}. MONO заново обработает этот набор с новой публикацией.</p>
      <label>
        Заголовок
        <input
          className="dash-input"
          required
          value={draft.title}
          onChange={(event) => field("title", event.target.value)}
        />
      </label>
      <div className="dash-form-pair">
        <label>
          Источник
          <input
            className="dash-input"
            required
            value={draft.source}
            onChange={(event) => field("source", event.target.value)}
          />
        </label>
        <label>
          Дата публикации, МСК
          <input
            className="dash-input"
            type="datetime-local"
            required
            value={draft.publishedAt}
            onChange={(event) => field("publishedAt", event.target.value)}
          />
        </label>
      </div>
      <label>
        Ссылка
        <input
          className="dash-input"
          type="url"
          value={draft.url}
          onChange={(event) => field("url", event.target.value)}
        />
      </label>
      <label>
        Текст публикации
        <textarea
          className="dash-input"
          required
          rows={3}
          value={draft.text}
          onChange={(event) => field("text", event.target.value)}
        />
      </label>
      <button type="submit" className="dash-button dash-button-primary">
        <ArrowClockwise size={16} /> Добавить и перезапустить
      </button>
    </form>
  );
}

function useWorkspace(baseHref: string) {
  const [controlTime, setControlTime] = useState(sampleControlTime);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [runError, setRunError] = useState("");
  const [run, setRun] = useState<DigestRun | null>(null);
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const period = getPeriod(controlTime);

  useEffect(() => {
    const pending = readRunId(pendingRunKey);
    const previous = readRunId(lastRunKey);
    if (!pending && !previous) return;

    const controller = new AbortController();
    const { signal } = controller;
    activeRequest.current = controller;
    setRunning(true);

    async function restore() {
      if (pending) {
        try {
          setRun(await finishPendingRun(pending, signal, setStatus));
          return;
        } catch (error) {
          if (signal.aborted) return;
          setRunError(error instanceof Error ? error.message : "Не удалось восстановить текущий запуск.");
        }
      }
      if (previous) {
        try {
          const completed = await getRunStatus(previous, signal);
          if (completed.status !== "done") throw new Error("Результаты предыдущего выпуска недоступны.");
          const result = await loadRun(completed, signal);
          if (!signal.aborted) setRun(result);
        } catch (error) {
          if (!signal.aborted && !pending) {
            setRunError(error instanceof Error ? error.message : "Не удалось загрузить предыдущий выпуск.");
          }
        }
      }
    }

    void restore().finally(() => {
      if (signal.aborted) return;
      activeRequest.current = null;
      setRunning(false);
    });
    return () => activeRequest.current?.abort();
  }, []);

  async function start(article?: ArticleDraft) {
    if (activeRequest.current || (article ? !run : !period || fileError)) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const { signal } = controller;
    setRunning(true);
    setRunError("");
    setStatus(null);
    setDialog(null);
    try {
      const started = article && run
        ? await addArticle(run.id, article, signal)
        : await createRun(controlTime, file, signal);
      signal.throwIfAborted();
      storeRunId(pendingRunKey, started.run_id);
      setRun(await finishPendingRun(started.run_id, signal, setStatus));
    } catch (error) {
      if (!signal.aborted) {
        setRunError(error instanceof Error ? error.message : "Не удалось обработать публикации.");
      }
    } finally {
      if (!signal.aborted) {
        activeRequest.current = null;
        setRunning(false);
      }
    }
  }

  function selectDataset(next?: File) {
    if (!next) return;
    if (!/\.(jsonl?|csv)$/i.test(next.name) || !next.size || next.size > uploadLimit) {
      setFile(null);
      setFileError("Выберите непустой файл JSON, JSONL или CSV до 8 МБ.");
      if (upload.current) upload.current.value = "";
      return;
    }
    setFileError("");
    setFile(next);
  }

  function resetDataset() {
    if (upload.current) upload.current.value = "";
    setFileError("");
    setFile(null);
    setControlTime(sampleControlTime);
  }

  return {
    baseHref, controlTime, setControlTime, file, fileError, runError, run, status,
    running, period, upload, start, selectDataset, resetDataset, dialog, setDialog,
    cancelActiveRun: () => activeRequest.current?.abort(),
  };
}

type Workspace = ReturnType<typeof useWorkspace>;
const WorkspaceContext = createContext<Workspace | null>(null);

function AccountActions({ onSignOut }: { onSignOut: () => void }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        menu.current?.open &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  return (
    <details
      className="dash-actions"
      ref={menu}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          event.preventDefault();
          menu.current.open = false;
          trigger.current?.focus();
        }
      }}
    >
      <summary className="dash-button" ref={trigger}>
        <DotsThree size={18} weight="bold" aria-hidden="true" /> Действия{" "}
        <CaretDown size={13} aria-hidden="true" />
      </summary>
      <div className="dash-actions-popover">
        <button
          type="button"
          onClick={() => {
            toggleTheme("dark");
            menu.current?.removeAttribute("open");
            trigger.current?.focus();
          }}
        >
          <span className="dash-to-light">
            <Sun size={17} aria-hidden="true" /> Светлая тема
          </span>
          <span className="dash-to-dark">
            <Moon size={17} aria-hidden="true" /> Тёмная тема
          </span>
        </button>
        <button className="dash-sign-out" type="button" onClick={onSignOut}>
          <SignOut size={17} aria-hidden="true" /> Выйти
        </button>
      </div>
    </details>
  );
}

function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const account = readDemoAccount();
    if (account) {
      setName(account.name);
      setEmail(account.email);
    }
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const address = email.trim();
    if (!cleanName || !address) {
      setFeedback("Укажите имя и электронную почту.");
      return;
    }
    setName(cleanName);
    setEmail(address);
    setFeedback(
      saveDemoAccount({ name: cleanName, email: address })
        ? "Изменения сохранены в этой вкладке."
        : "Хранилище браузера недоступно. Изменения пока видны в форме.",
    );
  }

  return (
    <section
      className="dash-panel dash-profile"
      aria-labelledby="dash-profile-title"
    >
      <div className="dash-profile-heading">
        <span className="dash-profile-icon">
          <UserCircle size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 id="dash-profile-title">Личные данные</h2>
          <p>Имя и адрес электронной почты демопрофиля.</p>
        </div>
      </div>
      <form className="dash-dialog-form" onSubmit={submit}>
        <label>
          Имя
          <input
            className="dash-input"
            autoComplete="name"
            maxLength={100}
            placeholder="Ваше имя"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setFeedback("");
            }}
          />
        </label>
        <label>
          Электронная почта
          <input
            className="dash-input"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFeedback("");
            }}
          />
        </label>
        <p className="dash-profile-security">
          <ShieldCheck size={16} aria-hidden="true" /> Смена пароля станет
          доступна после подключения авторизации.
        </p>
        <button type="submit" className="dash-button dash-button-primary">
          <Check size={16} aria-hidden="true" /> Сохранить изменения
        </button>
        {feedback && (
          <p className="dash-feedback" role="status">
            {feedback}
          </p>
        )}
      </form>
    </section>
  );
}

function Launch({
  baseHref,
  controlTime,
  setControlTime,
  file,
  fileError,
  status,
  running,
  period,
  upload,
  start,
  selectDataset,
  resetDataset,
}: Workspace) {
  return (
    <div className="dash-setup" id="run-settings" tabIndex={-1}>
      <section className="dash-panel dash-run" aria-labelledby="dash-run-title">
        <h2 id="dash-run-title">Новый выпуск</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          <div className="dash-run-fields">
            <div className="dash-field">
              <span>Набор публикаций</span>
              <label className="dash-upload">
                <CloudArrowUp size={20} aria-hidden="true" />
                <span>
                  <strong>{file?.name ?? "Учебный набор"}</strong>
                  <small>{file ? "Нажмите, чтобы заменить файл" : sampleDataset + " · можно загрузить свой файл"}</small>
                </span>
                <input
                  ref={upload}
                  type="file"
                  accept=".json,.jsonl,.csv"
                  aria-label="Выбрать набор публикаций"
                  disabled={running}
                  onChange={(event) => selectDataset(event.target.files?.[0])}
                />
              </label>
              <Link className="dash-inline-link dash-format-link" href={baseHref + "/guide#own-data"}>
                Формат файла и пример
              </Link>
            </div>
            <label className="dash-field">
              <span>
                Конец периода <small>МСК</small>
              </span>
              <input
                className="dash-input"
                type="datetime-local"
                aria-describedby="dash-period-note"
                required
                disabled={running}
                value={controlTime}
                onChange={(event) => setControlTime(event.target.value)}
              />
            </label>
          </div>
          {fileError && (
            <p className="dash-error" role="alert">
              {fileError}
            </p>
          )}
          <p className="dash-period-label">
            <Clock size={14} aria-hidden="true" />{" "}
            {period ? "Период: " + period : "Укажите конец периода"}
          </p>
          <p className="dash-run-note" id="dash-period-note">
            В выпуск попадут подходящие публикации за 24 часа до выбранного времени.
          </p>
          <div className="dash-run-actions">
            <button
              type="submit"
              className="dash-button dash-button-primary"
              disabled={running || !!fileError || !period}
            >
              <Play size={16} weight="fill" />{" "}
              {running ? "Обработка…" : "Собрать дайджест"}
            </button>
            {(file || fileError || controlTime !== sampleControlTime) && (
              <button
                type="button"
                className="dash-text-button"
                disabled={running}
                onClick={resetDataset}
              >
                Вернуть учебный набор
              </button>
            )}
            <Link className="dash-text-button" href={baseHref + "/guide#first-run"}>Как запустить</Link>
          </div>
        </form>
      </section>
      {running && <RunProgress status={status} />}
    </div>
  );
}

function Result({ section, run, baseHref }: { section: ResultSection; run: DigestRun; baseHref: string }) {
  switch (section) {
    case "digest":
      return run.events.length ? (
        <>
          <div className="dash-result-heading">
            <h2>События выпуска</h2>
            {run.report.llm.provider === "mock" && (
              <p>Учебный выпуск. Тестовый режим использует шаблонные заголовки и тексты.</p>
            )}
            {run.shortfall && <p>{run.shortfall}</p>}
          </div>
          <EventList run={run} />
          <div className="dash-inline dash-result-next">
            <Link href={baseHref + "/journal"} className="dash-button">Журнал обработки</Link>
            <Link href={baseHref + "/post"} className="dash-button">Открыть пост <ArrowRight size={15} aria-hidden="true" /></Link>
            <Link href={baseHref + "/email"} className="dash-button">Открыть письмо <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </>
      ) : (
        <div className="dash-empty-actions">
          <h2>В выпуске нет событий</h2>
          <p>MONO обработал набор, но подходящих событий за выбранный период не осталось. Причина по каждой публикации указана в журнале.</p>
          {run.report.llm.provider === "mock" && (
            <p>Этот выпуск собран в тестовом режиме. Его можно использовать, чтобы проверить работу интерфейса, журнала и выгрузки.</p>
          )}
          <div className="dash-inline">
            <Link className="dash-button dash-button-primary" href={baseHref + "/journal"}>Посмотреть причины в журнале</Link>
            <Link className="dash-button" href={baseHref + "#run-settings"}>Изменить набор или период</Link>
          </div>
        </div>
      );
    case "post":
      return <PostPreview run={run} />;
    case "email":
      return (
        <>
          <div className="dash-result-heading">
            <h2>Предпросмотр письма</h2>
            <p>Тема, период и полный текст выпуска</p>
          </div>
          <div className="dash-email">
            <div className="dash-email-subject">
              <small>Тема письма</small>
              <h3>{run.letter.subject}</h3>
              <p>{run.period}</p>
            </div>
            {run.letter.html ? (
              <iframe title="Письмо дайджеста" sandbox="" srcDoc={run.letter.html} />
            ) : <pre className="dash-post">{run.letter.text}</pre>}
          </div>
        </>
      );
    case "journal":
      return <Journal run={run} />;
    case "report":
      return <RunReport run={run} />;
  }
}

export function WorkspacePage({
  section,
}: {
  section: DashboardSection | "setup";
}) {
  const workspace = useContext(WorkspaceContext);
  const heading = useRef<HTMLHeadingElement>(null);
  if (!workspace)
    throw new Error("WorkspacePage requires the dashboard layout");
  const { run, runError, running, status, baseHref, setDialog } = workspace;
  const isHome = section === "setup";
  const isResult =
    section !== "setup" && section !== "profile" && section !== "guide";
  const showHint = section === "setup"
    ? !run && !running
    : section === "profile" || (isResult && run && !running && (section !== "digest" || run.events.length > 0));

  return (
    <>
      <div className="dash-title">
        <div>
          <h1 ref={heading} tabIndex={-1}>{isHome ? "Главное" : dashboardSections[section]}</h1>
          {isHome && (
            <p>
              Загрузите публикации о кибербезопасности и получите дайджест со ссылками на источники.
            </p>
          )}
          {isResult && run && !running && <p className="dash-issue-meta">{run.dataset} · {run.period}</p>}
        </div>
        {isResult && run && !running && (
          <div className="dash-inline">
            {section === "journal" && (
              <button type="button" className="dash-button dash-button-primary" onClick={() => setDialog("article")}>
                <Plus size={17} aria-hidden="true" /> Добавить публикацию
              </button>
            )}
            {section === "email" && (
              <button type="button" className="dash-button dash-button-primary" onClick={() => setDialog("send")}>
                <PaperPlaneTilt size={16} aria-hidden="true" /> Проверить отправку
              </button>
            )}
            <button
              type="button"
              className="dash-button"
              onClick={() => setDialog("export")}
            >
              <DownloadSimple size={17} aria-hidden="true" /> Скачать материалы
            </button>
          </div>
        )}
      </div>
      {section !== "guide" && showHint && (
        <PageHint
          key={section}
          section={section}
          baseHref={baseHref}
          onDismiss={() => heading.current?.focus({ preventScroll: true })}
        />
      )}
      {(isHome || isResult) && runError && (
        <p className="dash-error" role="alert">
          {runError}{run && " Ниже показан последний завершённый выпуск."}
        </p>
      )}
      {section === "setup" ? (
        <>
          <Launch {...workspace} />
          {run && (
            <>
              <LatestIssue baseHref={baseHref} run={run} running={running} onExport={() => setDialog("export")} />
              <RunStatistics baseHref={baseHref} run={run} />
            </>
          )}
        </>
      ) : section === "guide" ? (
        <DashboardGuide baseHref={baseHref} />
      ) : section === "profile" ? (
        <Profile />
      ) : running ? (
        <RunProgress status={status} />
      ) : !run ? (
        <section className="dash-panel dash-result-content dash-empty-actions">
          <h2>Сначала соберите выпуск</h2>
          <p>{runError
            ? "Запустите обработку заново с учебным или своим набором."
            : "Здесь появится результат обработки. Для первого запуска можно взять готовый учебный набор."}</p>
          <div className="dash-inline">
            <Link className="dash-button dash-button-primary" href={baseHref + "#run-settings"}>К форме запуска</Link>
            <Link className="dash-button" href={baseHref + "/guide#first-run"}>Как запустить</Link>
          </div>
        </section>
      ) : (
        <section
          className="dash-panel dash-result-content"
          aria-label="Результаты выпуска"
        >
          <Result section={section} run={run} baseHref={baseHref} />
        </section>
      )}
    </>
  );
}

export function Dashboard({
  baseHref,
  homeHref,
  children,
}: {
  baseHref: string;
  homeHref: string;
  children: ReactNode;
}) {
  const workspace = useWorkspace(baseHref);
  const { dialog, setDialog, run, start } = workspace;
  const segment = useSelectedLayoutSegment();

  useEffect(() => {
    function checkSession() {
      if (readDemoAccount() === null) window.location.replace(homeHref);
    }
    checkSession();
    window.addEventListener("pageshow", checkSession);
    return () => window.removeEventListener("pageshow", checkSession);
  }, [homeHref, segment]);

  function signOut() {
    workspace.cancelActiveRun();
    saveDemoAccount(null);
    storeRunId(lastRunKey, null);
    storeRunId(pendingRunKey, null);
    window.location.replace(homeHref);
  }

  return (
    <WorkspaceContext.Provider value={workspace}>
      <div className="dash" lang="ru" dir="ltr">
        <aside className="dash-sidebar">
          <div className="dash-sidebar-brand">
            <Link
              className="header-wordmark"
              href={baseHref}
              aria-label="MONO"
            />
            <span>Рабочая область</span>
          </div>
          <nav className="dash-nav" aria-label="Рабочая область">
            <Link
              href={baseHref}
              aria-current={segment === null ? "page" : undefined}
            >
              <SquaresFour size={18} aria-hidden="true" /> Главное
            </Link>
            {resultGroups.map(({ label, items }) => (
              <div className="dash-nav-group" role="group" aria-label={label} key={label}>
                <p className="dash-side-label" aria-hidden="true">{label}</p>
                {items.map(({ id, icon: Icon }) => (
                  <Link
                    href={baseHref + "/" + id}
                    key={id}
                    aria-current={segment === id ? "page" : undefined}
                  >
                    <Icon size={18} aria-hidden="true" /> {dashboardSections[id]}
                  </Link>
                ))}
              </div>
            ))}
            <p className="dash-side-label">Сервис</p>
            <Link
              href={baseHref + "/guide"}
              aria-current={segment === "guide" ? "page" : undefined}
            >
              <BookOpen size={18} aria-hidden="true" /> Инструкция
            </Link>
            <Link
              href={baseHref + "/profile"}
              aria-current={segment === "profile" ? "page" : undefined}
            >
              <UserCircle size={18} aria-hidden="true" /> Профиль
            </Link>
          </nav>
          <div className="dash-sidebar-end">
            <AccountActions onSignOut={signOut} />
          </div>
        </aside>

        <main className="dash-main">
          <header className="dash-header">
            <div className="dash-breadcrumb">
              <SquaresFour size={16} aria-hidden="true" />
              <span>Рабочая область</span>
              <CaretRight size={12} aria-hidden="true" />
              <strong>
                {dashboardSections[segment as DashboardSection] ?? "Главное"}
              </strong>
            </div>
          </header>
          <div className="dash-content">{children}</div>
        </main>

        {dialog === "export" && run && (
          <Dialog title="Скачать материалы" onClose={() => setDialog(null)}>
            <p className="dash-dialog-note">
              Архив с дайджестом, постом, письмом, журналом и отчётом о прогоне.
            </p>
            <a className="dash-button dash-button-primary" href={exportUrl(run.id)} download>
              <DownloadSimple size={16} /> Скачать ZIP
            </a>
          </Dialog>
        )}
        {dialog === "send" && run && (
          <Dialog title="Проверка отправки" onClose={() => setDialog(null)}>
            <SendForm runId={run.id} />
          </Dialog>
        )}
        {dialog === "article" && run && (
          <Dialog title="Добавить публикацию" onClose={() => setDialog(null)}>
            <ArticleForm run={run} onSubmit={start} />
          </Dialog>
        )}
      </div>
    </WorkspaceContext.Provider>
  );
}
