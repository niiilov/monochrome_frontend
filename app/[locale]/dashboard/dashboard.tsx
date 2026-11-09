"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
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
  Globe,
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
import { apiRequest, type Account } from "../../api-client";
import { MailingList } from "./mailing";
import { SourcesPanel } from "./sources";
import { SendDigestForm } from "./send-digest";
import { toggleTheme } from "../../theme";
import { DashboardGuide, PageHint } from "./dashboard-guide";
import {
  LatestIssue,
  RunStatistics,
  RunStatusChart,
} from "./dashboard-overview";
import { DashboardSelect } from "./dashboard-select";
import {
  addArticle,
  createRun,
  exportUrl,
  finishPendingRun,
  getPeriod,
  getRunStatus,
  moscowNowInput,
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
const statusOptions = [
  { value: "" as const, label: "Все статусы" },
  ...statuses.map((status) => ({ value: status, label: status })),
];
const statusClasses: Record<Status, string> = {
  включён: "included",
  объединён: "merged",
  исключён: "excluded",
};
const providerOptions = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai", label: "OpenAI" },
  { value: "compatible", label: "OpenAI-совместимый API" },
] as const;
type DialogKind = "export" | "send" | "article";
type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };
type Notify = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<Notify>(() => undefined);

function useToast() {
  return useContext(ToastContext);
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="dash-toasts" aria-live="polite" aria-label="Оповещения">
      {items.map((item) => (
        <article
          className="dash-toast"
          data-kind={item.kind}
          key={item.id}
          role={item.kind === "error" ? "alert" : "status"}
        >
          <span className="dash-toast-mark" aria-hidden="true">
            {item.kind === "success" ? <Check size={16} weight="bold" /> : "!"}
          </span>
          <p>{item.message}</p>
          <button
            type="button"
            aria-label="Закрыть уведомление"
            onClick={() => onDismiss(item.id)}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </article>
      ))}
    </div>
  );
}

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
  const listId = useId();
  const count = run.events.length;
  const plural = new Intl.PluralRules("ru").select(count);
  const countLabel = plural === "one" ? "событие" : plural === "few" ? "события" : "событий";

  return (
    <>
      <div className="dash-result-heading">
        <div className="dash-events-heading">
          <h2>События выпуска</h2>
          <span>{String(count).padStart(2, "0")} {countLabel}</span>
        </div>
        {run.report.llm.provider === "mock" && (
          <p>Учебный выпуск. Тестовый режим использует шаблонные заголовки и тексты.</p>
        )}
        {run.shortfall && <p>{run.shortfall}</p>}
      </div>
      <ol className="dash-events" key={run.id}>
        {run.events.map((event, index) => {
          const titleId = `${listId}-title-${index}`;
          const summaryId = `${listId}-summary-${index}`;
          return (
            <li className="dash-event" key={event.group}>
              <details name={listId} open={index === 0}>
                <summary className="dash-event-summary" aria-labelledby={titleId} aria-describedby={summaryId}>
                  <span className="dash-event-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="dash-event-title" id={titleId}>{event.title}</span>
                    <span className="dash-event-lead" id={summaryId}>{event.summary}</span>
                  </span>
                  <CaretDown size={16} aria-hidden="true" />
                </summary>
                <div className="dash-event-body">
                  <dl className="dash-facts">
                    <div>
                      <dt>Последствия</dt>
                      <dd>{event.impact}</dd>
                    </div>
                    <div>
                      <dt>Почему в выпуске</dt>
                      <dd>{event.reason}</dd>
                    </div>
                  </dl>
                  {event.sources.length > 0 && (
                    <div className="dash-sources">
                      <span>Источники</span>
                      <ul aria-label="Источники">
                        {event.sources.map((source) => (
                          <li key={source.id}>
                            <a href={sourceLink(source.url)} target="_blank" rel="noreferrer">
                              {source.name} <ArrowSquareOut size={13} aria-hidden="true" />
                            </a>
                            <small>{[source.date, source.role, source.id].filter(Boolean).join(" · ")}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function Journal({ run }: { run: DigestRun }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "">("");
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
          <DashboardSelect
            label="Фильтр по статусу"
            options={statusOptions}
            value={status}
            onChange={setStatus}
          />
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
  const notify = useToast();
  const post = run.post;
  const count = Array.from(post.replace(/https?:\/\/[^\s;]+/g, "")).length;
  async function copyPost() {
    try {
      await navigator.clipboard.writeText(post);
      notify("Пост скопирован в буфер обмена.");
    } catch {
      notify("Не удалось скопировать пост. Скачайте материалы и откройте post.txt.", "error");
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
      <pre className="dash-post">{post}</pre>
    </>
  );
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  if (seconds <= 60) return `${seconds} с`;
  return `${Math.round(seconds / 60)} мин.`;
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
          <dd>{formatDuration(report.duration_ms)}</dd>
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
    </>
  );
}

function SendForm({ runId }: { runId: string }) {
  const notify = useToast();
  const workspace = useContext(WorkspaceContext)!;
  return <SendDigestForm runId={runId} mailingHref={workspace.baseHref + "/mailing"} onNotice={notify} />;
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

function useWorkspace(baseHref: string, notify: Notify, initialAccount: Account) {
  const [account,setAccount] = useState(initialAccount);
  const [controlTime, setControlTime] = useState(sampleControlTime);
  const [source, setSource] = useState<"file" | "sites">("file");
  const sitesClock = useRef(false);
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

    const controller = new AbortController();
    const { signal } = controller;
    activeRequest.current = controller;
    setRunning(true);

    async function restore() {
      const history = await apiRequest<{runs: {run_id:string;status:string}[]}>("runs","GET",undefined,signal);
      const pending = history.runs.find(item=>item.status==="running")?.run_id;
      const previous = history.runs.find(item=>item.status==="done")?.run_id;
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

    void restore().catch(error=>{ if(!signal.aborted) setRunError(error instanceof Error ? error.message : "Не удалось загрузить историю."); }).finally(() => {
      if (signal.aborted) return;
      activeRequest.current = null;
      setRunning(false);
    });
    return () => activeRequest.current?.abort();
  }, []);

  async function start(article?: ArticleDraft) {
    if (activeRequest.current || (article ? !run : !period || (source === "file" && fileError))) return;
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
        : await createRun(controlTime, source === "sites" ? null : file, signal, source === "sites");
      signal.throwIfAborted();
      storeRunId(pendingRunKey, started.run_id);
      const completed = await finishPendingRun(started.run_id, signal, setStatus);
      setRun(completed);
      notify(
        article ? "Публикация добавлена, выпуск обновлён." : "Выпуск собран и готов к просмотру.",
      );
    } catch (error) {
      if (!signal.aborted) {
        const message = error instanceof Error ? error.message : "Не удалось обработать публикации.";
        setRunError(message);
        notify(message, "error");
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
      notify("Выберите непустой файл JSON, JSONL или CSV до 8 МБ.", "error");
      if (upload.current) upload.current.value = "";
      return;
    }
    setFileError("");
    setFile(next);
    notify(`Файл «${next.name}» выбран.`, "info");
  }

  function resetDataset() {
    if (upload.current) upload.current.value = "";
    setFileError("");
    setFile(null);
    setSource("file");
    sitesClock.current = false;
    setControlTime(sampleControlTime);
    notify("Учебный набор восстановлен.", "info");
  }

  function chooseSource(next: "file" | "sites") {
    setSource(next);
    if (next === "sites") {
      setFileError("");
      if (controlTime === sampleControlTime) {
        setControlTime(moscowNowInput());
        sitesClock.current = true;
      }
      return;
    }
    if (sitesClock.current) {
      sitesClock.current = false;
      setControlTime(sampleControlTime);
    }
  }

  function setControl(value: string) {
    sitesClock.current = false;
    setControlTime(value);
  }

  return {
    account, setAccount, baseHref, controlTime, setControlTime: setControl, source, chooseSource, file, fileError, runError, run, status,
    running, period, upload, start, selectDataset, resetDataset, dialog, setDialog,
    cancelActiveRun: () => activeRequest.current?.abort(),
  };
}

type Workspace = ReturnType<typeof useWorkspace>;
const WorkspaceContext = createContext<Workspace | null>(null);

function AccountActions({ onSignOut }: { onSignOut: () => void }) {
  const notify = useToast();
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
            notify(
              document.documentElement.dataset.theme === "light"
                ? "Включена светлая тема."
                : "Включена тёмная тема.",
              "info",
            );
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
  const workspace = useContext(WorkspaceContext)!;
  const notify = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [developerMode, setDeveloperMode] = useState(false);
  const [developerPrompt, setDeveloperPrompt] = useState(false);
  const [provider, setProvider] = useState<(typeof providerOptions)[number]["value"]>("openrouter");

  useEffect(() => {
    const account = workspace.account;
    if (account) {
      setName(account.name);
      setEmail(account.email);
    }
  }, [workspace.account]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const address = email.trim();
    if (!cleanName || !address) {
      setFeedback("Укажите имя и электронную почту.");
      notify("Укажите имя и электронную почту.", "error");
      return;
    }
    setName(cleanName);
    setEmail(address);
    try {
      const data=await apiRequest<{user:Account}>("auth/me","PATCH",{name:cleanName});
      workspace.setAccount(data.user);setFeedback("Имя сохранено в аккаунте.");notify("Имя сохранено в аккаунте.");
    } catch(error) { const message=error instanceof Error ? error.message : "Не удалось сохранить имя.";setFeedback(message);notify(message,"error"); }
  }

  return (
    <>
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
            <p>Имя и подтверждённый адрес электронной почты.</p>
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
              value={email} readOnly
              onChange={(event) => {
                setEmail(event.target.value);
                setFeedback("");
              }}
            />
          </label>
          <p className="dash-profile-security">
            <ShieldCheck size={16} aria-hidden="true" /> Почта подтверждена.
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

        {!developerMode ? (
          <div className="dash-developer-callout">
            <div>
              <h3>Нужны настройки модели?</h3>
              <p>Откройте режим разработчика для настройки провайдера, модели и API-токена.</p>
            </div>
            <button type="button" className="dash-button" onClick={() => setDeveloperPrompt(true)}>
              Для разработчиков
            </button>
          </div>
        ) : (
          <section className="dash-developer" aria-labelledby="dash-developer-title">
            <div className="dash-panel-head">
              <div>
                <h2 id="dash-developer-title">Настройки модели</h2>
                <p>Параметры будут доступны для защищённого сохранения после подключения API настроек.</p>
              </div>
              <span className="dash-dev-badge">Режим разработчика</span>
            </div>
            <div className="dash-dialog-form dash-developer-form">
              <div className="dash-form-pair">
                <DashboardSelect
                  label="Провайдер"
                  showLabel
                  options={providerOptions}
                  value={provider}
                  onChange={setProvider}
                />
                <label>
                  Модель
                  <input className="dash-input" defaultValue="google/gemini-3.5-flash-lite" aria-label="Модель" />
                </label>
              </div>
              <label>
                API-токен
                <input className="dash-input" type="password" autoComplete="new-password" placeholder="Введите токен" aria-describedby="dash-token-note" />
              </label>
              <label>
                Базовый URL API
                <input className="dash-input" type="url" defaultValue="https://openrouter.ai/api/v1" aria-label="Базовый URL API" />
              </label>
              <p className="dash-developer-note" id="dash-token-note">
                <ShieldCheck size={16} aria-hidden="true" /> Токен не сохраняется в браузере и не отправляется в этой версии интерфейса.
              </p>
              <div className="dash-inline">
                <button type="button" className="dash-button dash-button-primary" disabled>Сохранить настройки</button>
                <span className="dash-settings-status">Нужен защищённый API настроек</span>
              </div>
            </div>
          </section>
        )}
      </section>

      {developerPrompt && (
        <Dialog title="Включить режим разработчика" onClose={() => setDeveloperPrompt(false)}>
          <p className="dash-dialog-note">Этот режим открывает поля для провайдера, модели и токена. Пока интерфейс демонстрационный: токен не будет сохранён или передан на сервер.</p>
          <div className="dash-inline">
            <button type="button" className="dash-button dash-button-primary" onClick={() => {
              setDeveloperMode(true);
              setDeveloperPrompt(false);
              notify("Режим разработчика включён.", "info");
            }}>
              Продолжить
            </button>
            <button type="button" className="dash-button" onClick={() => setDeveloperPrompt(false)}>Отмена</button>
          </div>
        </Dialog>
      )}
    </>
  );
}

const keywordStorageKey = "mono-digest-keywords-v1";

function KeywordField() {
  const notify = useToast();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(keywordStorageKey) ?? "[]");
      if (Array.isArray(saved)) {
        setKeywords(saved.filter((item): item is string => typeof item === "string").slice(0, 12));
      }
    } catch {}
  }, []);

  function update(next: string[]) {
    setKeywords(next);
    try {
      localStorage.setItem(keywordStorageKey, JSON.stringify(next));
      return true;
    } catch {
      notify("Не удалось сохранить ключевые слова в браузере.", "error");
      return false;
    }
  }

  function addKeyword() {
    const additions = value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter((item) => item && !keywords.some((keyword) => keyword.toLocaleLowerCase() === item.toLocaleLowerCase()));
    if (additions.length) {
      if (update([...keywords, ...additions].slice(0, 12))) {
        notify("Ключевые слова сохранены.");
      }
    } else if (value.trim()) {
      notify("Такие ключевые слова уже добавлены.", "info");
    }
    setValue("");
  }

  return (
    <div className="dash-field dash-keywords">
      <span>Ключевые слова <small>необязательно</small></span>
      <div className="dash-keyword-entry">
        <input
          className="dash-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addKeyword();
            }
          }}
          placeholder="Например: ransomware, CVE"
          aria-label="Ключевые слова"
        />
        <button className="dash-button" type="button" disabled={!value.trim()} onClick={addKeyword}>
          <Plus size={15} aria-hidden="true" /> Добавить
        </button>
      </div>
      <div className="dash-keyword-tags" aria-live="polite">
        {keywords.map((keyword) => (
          <span className="dash-keyword-tag" key={keyword}>
            {keyword}
            <button type="button" aria-label={`Удалить «${keyword}»`} onClick={() => {
              if (update(keywords.filter((item) => item !== keyword))) {
                notify(`Ключевое слово «${keyword}» удалено.`, "info");
              }
            }}>
              <X size={12} weight="bold" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function Launch({
  baseHref,
  controlTime,
  setControlTime,
  source,
  chooseSource,
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
          <div className="dash-source-switch" role="group" aria-label="Откуда брать публикации">
            <button
              type="button"
              className="dash-button"
              aria-pressed={source === "file"}
              disabled={running}
              onClick={() => chooseSource("file")}
            >
              <CloudArrowUp size={16} aria-hidden="true" /> Из JSON
            </button>
            <button
              type="button"
              className="dash-button"
              aria-pressed={source === "sites"}
              disabled={running}
              onClick={() => chooseSource("sites")}
            >
              <Globe size={16} aria-hidden="true" /> С сайтов
            </button>
          </div>
          <div className="dash-run-fields">
            {source === "sites" ? (
              <div className="dash-field">
                <span>Источники</span>
                <p className="dash-sites-note">
                  Берутся включённые сайты из раздела <Link href={baseHref + "/sources"}>Источники</Link>. В выпуск попадают материалы за 24 часа до выбранного времени.
                </p>
              </div>
            ) : (
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
            )}
            <label className="dash-field">
              <span>
                Конец периода <small>МСК</small>
              </span>
              <input
                className="dash-input"
                type="datetime-local"
                aria-describedby="dash-run-period"
                required
                disabled={running}
                value={controlTime}
                onChange={(event) => setControlTime(event.target.value)}
              />
            </label>
            <KeywordField />
          </div>
          {fileError && (
            <p className="dash-error" role="alert">
              {fileError}
            </p>
          )}
          <p className="dash-period-label" id="dash-run-period">
            <Clock size={14} aria-hidden="true" />{" "}
            {period ? "Период: " + period : "Укажите конец периода"}
          </p>
          <div className="dash-run-actions">
            <button
              type="submit"
              className="dash-button dash-button-primary"
              disabled={running || !period || (source === "file" && !!fileError)}
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
    section !== "setup" && section !== "profile" && section !== "guide" && section !== "mailing" && section !== "sources";
  const showHint = section === "setup"
    ? !run && !running
    : section === "profile" || section === "mailing" || section === "sources" ||
      (isResult && run && !running && (section !== "digest" || run.events.length > 0));

  return (
    <>
      <div className="dash-title">
        <div>
          <h1 ref={heading} tabIndex={-1}>{isHome ? "Главное" : dashboardSections[section]}</h1>
          {section === "mailing" && <p>Получатели и правила отправки дайджестов.</p>}
          {section === "sources" && <p>Сайты, с которых собирается дайджест. Пять исходных источников уже добавлены.</p>}
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
                <PaperPlaneTilt size={16} aria-hidden="true" /> Отправить дайджест
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
      ) : section === "mailing" ? (
        <MailingList />
      ) : section === "sources" ? (
        <SourcesPanel />
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
  children, account, authHref,
}: {
  baseHref: string;
  homeHref: string;
  children: ReactNode;
  account: Account;
  authHref: string;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);
  const toastTimers = useRef(new Map<number, number>());
  const dismissToast = useCallback((id: number) => {
    const timer = toastTimers.current.get(id);
    if (timer) window.clearTimeout(timer);
    toastTimers.current.delete(id);
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);
  const notify = useCallback<Notify>((message, kind = "success") => {
    const id = ++nextToastId.current;
    setToasts((items) => [...items, { id, message, kind }].slice(-3));
    toastTimers.current.set(id, window.setTimeout(() => dismissToast(id), 4500));
  }, [dismissToast]);
  useEffect(() => () => {
    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current.clear();
  }, []);

  const workspace = useWorkspace(baseHref, notify, account);
  const { dialog, setDialog, run, start } = workspace;
  const segment = useSelectedLayoutSegment();

  useEffect(() => {
    const expired=()=>window.location.replace(authHref);
    const checkSession=()=>{ apiRequest<{user:Account}>("auth/me").then(data=>{ if(data.user.id!==account.id) window.location.reload(); }).catch(()=>{}); };
    window.addEventListener("pageshow",checkSession);
    window.addEventListener("mono-session-expired",expired);
    return ()=>{window.removeEventListener("pageshow",checkSession);window.removeEventListener("mono-session-expired",expired);};
  },[authHref,account.id]);

  async function signOut() {
    try {
      await apiRequest("auth/logout","POST",{});
      workspace.cancelActiveRun();storeRunId(lastRunKey,null);storeRunId(pendingRunKey,null);
      sessionStorage.removeItem("mono-demo-account");window.location.replace(authHref);
    } catch(error) {notify(error instanceof Error ? error.message : "Не удалось выйти.","error");}
  }

  return (
    <ToastContext.Provider value={notify}>
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
            <Link href={baseHref + "/mailing"} aria-current={segment === "mailing" ? "page" : undefined}><PaperPlaneTilt size={18} aria-hidden="true" /> Рассылка</Link>
            <Link href={baseHref + "/sources"} aria-current={segment === "sources" ? "page" : undefined}><Globe size={18} aria-hidden="true" /> Источники</Link>
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
          <Dialog title="Отправка дайджеста" onClose={() => setDialog(null)}>
            <SendForm runId={run.id} />
          </Dialog>
        )}
        {dialog === "article" && run && (
          <Dialog title="Добавить публикацию" onClose={() => setDialog(null)}>
            <ArticleForm run={run} onSubmit={start} />
          </Dialog>
        )}
          <ToastViewport items={toasts} onDismiss={dismissToast} />
        </div>
      </WorkspaceContext.Provider>
    </ToastContext.Provider>
  );
}
