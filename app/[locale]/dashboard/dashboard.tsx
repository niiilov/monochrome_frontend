"use client";

import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Article, ArrowClockwise, ArrowRight, ArrowSquareOut, CaretDown, CaretRight, Check, Clock,
  CloudArrowUp, Copy, DotsThree, DownloadSimple, EnvelopeSimple, FileText, ListChecks,
  MagnifyingGlass, Moon, PaperPlaneTilt, Play, Plus, ShieldCheck, SignOut, SquaresFour, Sun, UserCircle, X,
} from "@phosphor-icons/react";
import { readDemoAccount, saveDemoAccount } from "../../demo-account";
import { toggleTheme } from "../../theme";
import {
  createDemoRun, demoControlTime, demoDataset, demoRecipient, exampleArticles, getArtifacts,
  getPeriod, getRunReport, issueNote, maxEvents, renderPost,
  type ArticleDraft, type DemoRun, type Status,
} from "./demo";
import { dashboardSections, type DashboardSection } from "./sections";

const results = [
  { id: "digest", icon: Article },
  { id: "post", icon: FileText },
  { id: "email", icon: EnvelopeSimple },
  { id: "journal", icon: ListChecks },
  { id: "report", icon: ShieldCheck },
] as const;

const stages = ["Загрузка и период", "Отбор и объединение", "Сверка фактов", "Подготовка файлов"];
const statuses: Status[] = ["включён", "объединён", "исключён"];
const statusClasses: Record<Status, string> = { включён: "included", объединён: "merged", исключён: "excluded" };
type DialogKind = "export" | "send" | "article";

function downloadFile({ name, type, value }: ReturnType<typeof getArtifacts>[number]) {
  const url = URL.createObjectURL(new Blob([value], { type: type + ";charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="dash-dialog" onClose={onClose} aria-labelledby="dash-dialog-title">
      <header className="dash-dialog-header">
        <h2 id="dash-dialog-title">{title}</h2>
        <button type="button" className="dash-icon-button" aria-label="Закрыть" onClick={() => ref.current?.close()}><X size={18} /></button>
      </header>
      {children}
    </dialog>
  );
}

function RunProgress({ stage, running }: { stage: number; running: boolean }) {
  const percent = Math.round(stage / stages.length * 100);
  return (
    <section className="dash-panel dash-progress" aria-labelledby="dash-progress-title">
      <div className="dash-panel-head">
        <h2 id="dash-progress-title"><Clock size={17} aria-hidden="true" /> Ход обработки</h2>
        <span className="dash-progress-number">{percent}%</span>
      </div>
      <progress value={stage} max={stages.length} aria-label="Ход демонстрационного прогона" />
      <ol>
        {stages.map((label, index) => (
          <li key={label} data-stage={index < stage ? "done" : index === stage ? "active" : "waiting"}>
            <span className="dash-stage-mark" aria-hidden="true">{index < stage ? <Check size={12} weight="bold" /> : index + 1}</span>
            <span>{label}</span>
            <small>{index < stage ? "Готово" : index === stage && running ? "В работе" : "Ожидает"}</small>
          </li>
        ))}
      </ol>
      <p className="dash-progress-foot" role="status">{running ? "Идёт демонстрационный прогон" : "Демопрогон завершён"}</p>
    </section>
  );
}

function EventList({ run }: { run: DemoRun }) {
  return (
    <ol className="dash-events">
      {run.events.map(event => (
        <li className="dash-event" key={event.group}>
          <span className="dash-event-index">{event.group.slice(1)}</span>
          <div className="dash-event-body">
            <h3>{event.title}</h3>
            <dl className="dash-facts">
              <div><dt>Суть</dt><dd>{event.summary}</dd></div>
              <div><dt>Последствия</dt><dd>{event.impact}</dd></div>
              <div><dt>Обоснование</dt><dd>{event.reason}</dd></div>
            </dl>
            <div className="dash-sources" aria-label="Источники">
              {event.sources.map(source => (
                <a href={source.url} key={source.id} target="_blank" rel="noreferrer">
                  <ArrowSquareOut size={13} aria-hidden="true" /> {source.name}
                  <small>{source.date} · {source.id}</small>
                </a>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Journal({ run }: { run: DemoRun }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const term = query.trim().toLowerCase();
  const rows = run.journal.filter(row =>
    (!status || row.status === status) && [row.id, row.title, row.group, row.reason].some(field => field.toLowerCase().includes(term))
  );

  return (
    <div>
      <div className="dash-panel-head dash-result-heading">
        <div><h2>Журнал обработки</h2><p>{rows.length} из {run.journal.length} публикаций</p></div>
        <div className="dash-journal-controls">
          <label className="dash-search">
            <MagnifyingGlass size={16} aria-hidden="true" />
            <input type="search" aria-label="Поиск в журнале" placeholder="Поиск по ID или группе" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <select className="dash-input" aria-label="Фильтр по статусу" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="">Все статусы</option>
            {statuses.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      {rows.length ? (
        <div className="dash-table-wrap" tabIndex={0} role="region" aria-label="Таблица журнала">
          <table className="dash-table">
            <thead><tr><th scope="col">Материал</th><th scope="col">Статус</th><th scope="col">Группа</th><th scope="col">Причина</th><th scope="col">Ошибка</th></tr></thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <th scope="row"><small>{row.id}</small>{row.title}</th>
                  <td><span className={"dash-status " + statusClasses[row.status]}>{row.status}</span></td>
                  <td>{row.group || "–"}</td><td>{row.reason}</td><td>{row.error || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="dash-empty" role="status">По этим фильтрам публикаций нет.</p>}
    </div>
  );
}

function PostPreview({ run }: { run: DemoRun }) {
  const [notice, setNotice] = useState("");
  const post = renderPost(run);
  const count = Array.from(post.replace(/https?:\/\/[^\s;]+/g, "")).length;
  async function copyPost() {
    try {
      await navigator.clipboard.writeText(post);
      setNotice("Пост скопирован");
    } catch {
      setNotice("Воспользуйтесь выгрузкой post.txt");
    }
  }

  return (
    <>
      <div className="dash-panel-head dash-result-heading">
        <div><h2>Короткий пост</h2><p>{count} / 2 000 знаков без URL</p></div>
        <button type="button" className="dash-button" onClick={copyPost}><Copy size={16} /> Копировать</button>
      </div>
      {notice && <p className="dash-feedback" role="status">{notice}</p>}
      <pre className="dash-post">{post}</pre>
    </>
  );
}

function RunReport({ run }: { run: DemoRun }) {
  const report = getRunReport(run);
  return (
    <>
      <div className="dash-result-heading"><h2>Отчёт о запуске</h2><p>Параметры текущего демонстрационного выпуска</p></div>
      <dl className="dash-report">
        <div><dt>Выбранный файл</dt><dd>{report.selected_file}</dd></div>
        <div><dt>Данные выпуска</dt><dd>{report.dataset}</dd></div>
        <div><dt>Период</dt><dd>{run.period.label}</dd></div>
        <div><dt>Материалов / событий</dt><dd>{report.articles} / {report.events}</dd></div>
        <div><dt>Модель и версия промптов</dt><dd>Недоступны в деморежиме</dd></div>
        <div><dt>Обращений к модели</dt><dd>{report.llm_calls}</dd></div>
        <div><dt>Токены и стоимость</dt><dd>Недоступны в деморежиме</dd></div>
      </dl>
    </>
  );
}

function SendForm() {
  const [value, setValue] = useState(demoRecipient);
  const [feedback, setFeedback] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipients = new Set(value.trim().toLowerCase().split(/[\s,;]+/).filter(Boolean));
    setFeedback(recipients.size === 1 && recipients.has(demoRecipient)
      ? "Проверка прошла. Демоотправка завершена без доставки письма."
      : "В деморежиме доступен тестовый адрес " + demoRecipient + ".");
  }
  return (
    <form className="dash-dialog-form" onSubmit={submit}>
      <p>Доступен пробный прогон рассылки на адрес {demoRecipient}. Письмо будет доступно во вкладке «Письмо».</p>
      <label>Тестовые получатели<input className="dash-input" value={value} onChange={event => { setValue(event.target.value); setFeedback(""); }} required /></label>
      {feedback && <p className="dash-feedback" role="status">{feedback}</p>}
      <button type="submit" className="dash-button dash-button-primary"><PaperPlaneTilt size={16} /> Проверить отправку</button>
    </form>
  );
}

function ArticleForm({ controlTime, onSubmit }: { controlTime: string; onSubmit: (article: ArticleDraft) => void }) {
  const [draft, setDraft] = useState<ArticleDraft>({ title: "", source: "", url: "", publishedAt: controlTime, text: "" });
  function field(name: keyof ArticleDraft, value: string) {
    setDraft(current => ({ ...current, [name]: value }));
  }
  return (
    <form className="dash-dialog-form" onSubmit={event => { event.preventDefault(); onSubmit(draft); }}>
      <p>Готовые примеры показывают склейку дубля и запись о посторонней инструкции в журнале.</p>
      <div className="dash-inline">
        <button type="button" className="dash-button" onClick={() => setDraft({ ...exampleArticles.duplicate, publishedAt: controlTime })}>Подставить дубль</button>
        <button type="button" className="dash-button" onClick={() => setDraft({ ...exampleArticles.instruction, publishedAt: controlTime })}>Подставить инструкцию</button>
      </div>
      <label>Заголовок<input className="dash-input" required value={draft.title} onChange={event => field("title", event.target.value)} /></label>
      <div className="dash-form-pair">
        <label>Источник<input className="dash-input" required value={draft.source} onChange={event => field("source", event.target.value)} /></label>
        <label>Дата публикации, МСК<input className="dash-input" type="datetime-local" required value={draft.publishedAt} onChange={event => field("publishedAt", event.target.value)} /></label>
      </div>
      <label>Ссылка<input className="dash-input" type="url" value={draft.url} onChange={event => field("url", event.target.value)} /></label>
      <label>Текст публикации<textarea className="dash-input" required rows={3} value={draft.text} onChange={event => field("text", event.target.value)} /></label>
      <button type="submit" className="dash-button dash-button-primary"><ArrowClockwise size={16} /> Добавить и перезапустить</button>
    </form>
  );
}

function useWorkspace(baseHref: string) {
  const router = useRouter();
  const [controlTime, setControlTime] = useState(demoControlTime);
  const [datasetName, setDatasetName] = useState(demoDataset);
  const [fileError, setFileError] = useState("");
  const [run, setRun] = useState(() => createDemoRun(demoControlTime, demoDataset));
  const [pending, setPending] = useState<DemoRun | null>(null);
  const [stage, setStage] = useState(stages.length);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const period = getPeriod(controlTime);
  const running = pending !== null;

  useEffect(() => {
    if (!pending) return;
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      setStage(current);
      if (current === stages.length) {
        window.clearInterval(timer);
        setRun(pending);
        setPending(null);
      }
    }, 460);
    return () => window.clearInterval(timer);
  }, [pending]);

  function start(article?: ArticleDraft) {
    if (!period || !datasetName || running) return;
    const additions = run.datasetName === datasetName && run.controlTime === controlTime ? run.additions : [];
    setStage(0);
    setDialog(null);
    setPending(createDemoRun(controlTime, datasetName, article ? [...additions, article] : additions));
    if (article) router.push(baseHref + "/journal");
  }

  function selectDataset(file?: File) {
    if (!file) return;
    if (!/\.(jsonl?|csv)$/i.test(file.name) || !file.size) {
      setDatasetName("");
      setFileError(file.size ? "Выберите JSON, JSONL или CSV." : "Файл пуст. Выберите другой набор.");
      if (upload.current) upload.current.value = "";
      return;
    }
    setFileError("");
    setDatasetName(file.name);
  }

  function resetDataset() {
    if (upload.current) upload.current.value = "";
    setFileError("");
    setDatasetName(demoDataset);
  }

  return { baseHref, controlTime, setControlTime, datasetName, fileError, run, stage, running, period, upload, start, selectDataset, resetDataset, dialog, setDialog };
}

type Workspace = ReturnType<typeof useWorkspace>;
const WorkspaceContext = createContext<Workspace | null>(null);

function AccountActions({ onSignOut }: { onSignOut: () => void }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && menu.current?.open && !menu.current.contains(event.target)) menu.current.open = false;
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  return (
    <details className="dash-actions" ref={menu} onKeyDown={event => {
      if (event.key === "Escape" && menu.current?.open) {
        event.preventDefault();
        menu.current.open = false;
        trigger.current?.focus();
      }
    }}>
      <summary className="dash-button" ref={trigger}><DotsThree size={18} weight="bold" aria-hidden="true" /> Действия <CaretDown size={13} aria-hidden="true" /></summary>
      <div className="dash-actions-popover">
        <button type="button" onClick={() => {
          toggleTheme("dark");
          menu.current?.removeAttribute("open");
          trigger.current?.focus();
        }}>
          <span className="dash-to-light"><Sun size={17} aria-hidden="true" /> Светлая тема</span>
          <span className="dash-to-dark"><Moon size={17} aria-hidden="true" /> Тёмная тема</span>
        </button>
        <button className="dash-sign-out" type="button" onClick={onSignOut}><SignOut size={17} aria-hidden="true" /> Выйти</button>
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
    setFeedback(saveDemoAccount({ name: cleanName, email: address })
      ? "Изменения сохранены в этой вкладке."
      : "Хранилище браузера недоступно. Изменения пока видны в форме.");
  }

  return (
    <section className="dash-panel dash-profile" aria-labelledby="dash-profile-title">
      <div className="dash-profile-heading">
        <span className="dash-profile-icon"><UserCircle size={24} aria-hidden="true" /></span>
        <div><h2 id="dash-profile-title">Личные данные</h2><p>Имя и адрес электронной почты демопрофиля.</p></div>
      </div>
      <form className="dash-dialog-form" onSubmit={submit}>
        <label>Имя<input className="dash-input" autoComplete="name" maxLength={100} placeholder="Ваше имя" required value={name} onChange={event => { setName(event.target.value); setFeedback(""); }} /></label>
        <label>Электронная почта<input className="dash-input" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required value={email} onChange={event => { setEmail(event.target.value); setFeedback(""); }} /></label>
        <p className="dash-profile-security"><ShieldCheck size={16} aria-hidden="true" /> Смена пароля станет доступна после подключения авторизации.</p>
        <button type="submit" className="dash-button dash-button-primary"><Check size={16} aria-hidden="true" /> Сохранить изменения</button>
        {feedback && <p className="dash-feedback" role="status">{feedback}</p>}
      </form>
    </section>
  );
}

function Launch({ controlTime, setControlTime, datasetName, fileError, run, stage, running, period, upload, start, selectDataset, resetDataset, setDialog }: Workspace) {
  const merged = run.journal.filter(row => row.status === "объединён").length;
  const excluded = run.journal.filter(row => row.status === "исключён").length;
  const metrics = [
    { label: "Событий в выпуске", value: run.events.length, suffix: " / " + maxEvents, icon: Article },
    { label: "Публикаций в журнале", value: run.journal.length, icon: FileText },
    { label: "Объединено", value: merged, icon: ListChecks },
    { label: "Исключено", value: excluded, icon: ShieldCheck },
  ];

  return (
    <>
      <div className="dash-setup" id="run-settings">
        <section className="dash-panel dash-run" aria-labelledby="dash-run-title">
          <div className="dash-panel-head">
            <div><h2 id="dash-run-title">Новый прогон</h2><p>Выберите набор и задайте контрольное время.</p></div>
            <span className="dash-tag">До {maxEvents} событий</span>
          </div>
          <form onSubmit={event => { event.preventDefault(); start(); }}>
            <div className="dash-run-fields">
              <div className="dash-field">
                <span>Набор публикаций</span>
                <label className="dash-upload">
                  <CloudArrowUp size={20} aria-hidden="true" />
                  <span><strong>{datasetName || "Выбрать файл"}</strong><small>JSON, JSONL или CSV</small></span>
                  <input ref={upload} type="file" accept=".json,.jsonl,.csv" aria-label="Выбрать набор публикаций" disabled={running} onChange={event => selectDataset(event.target.files?.[0])} />
                </label>
              </div>
              <label className="dash-field">
                <span>Контрольное время <small>МСК</small></span>
                <input className="dash-input" type="datetime-local" required disabled={running} value={controlTime} onChange={event => setControlTime(event.target.value)} />
              </label>
            </div>
            {fileError && <p className="dash-error" role="alert">{fileError}</p>}
            <p className="dash-period-label"><Clock size={14} aria-hidden="true" /> {period?.label ?? "Укажите контрольное время"}</p>
            <div className="dash-run-actions">
              <button type="submit" className="dash-button dash-button-primary" disabled={running || !datasetName || !period}><Play size={16} weight="fill" /> {running ? "Выполняется…" : "Запустить"}</button>
              <button type="button" className="dash-button" disabled={running || !datasetName || !period} onClick={() => setDialog("article")}><Plus size={17} /> Добавить публикацию</button>
              {datasetName !== demoDataset && <button type="button" className="dash-text-button" disabled={running} onClick={resetDataset}>Выбрать демонабор</button>}
            </div>
            <p className="dash-run-note">Для предпросмотра используются вымышленные публикации.</p>
          </form>
        </section>
        <RunProgress stage={stage} running={running} />
      </div>
      <div className="dash-metrics" aria-label="Показатели прогона">
        {metrics.map(({ label, value, suffix, icon: Icon }, index) => (
          <article key={label} className={"dash-panel dash-metric" + (index === 0 ? " dash-metric-highlight" : "")}>
            <h2>{label}</h2><Icon className="dash-metric-icon" size={25} aria-hidden="true" />
            <p className="dash-metric-value">{running ? "–" : value}{!running && suffix && <span>{suffix}</span>}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function Result({ section, run }: { section: Exclude<DashboardSection, "profile">; run: DemoRun }) {
  switch (section) {
    case "digest":
      return (
        <>
          <div className="dash-panel-head dash-result-heading">
            <div><h2>Дайджест по кибербезопасности</h2><p>{run.period.label}</p></div>
            <span className="dash-tag">Демонстрационный выпуск</span>
          </div>
          <p className="dash-issue-note">{issueNote(run)}</p>
          <EventList run={run} />
        </>
      );
    case "post":
      return <PostPreview run={run} />;
    case "email":
      return (
        <>
          <div className="dash-result-heading"><h2>Предпросмотр письма</h2><p>Тема, период и полный текст выпуска</p></div>
          <div className="dash-email">
            <div className="dash-email-subject"><small>Тема письма</small><h3>Дайджест по кибербезопасности</h3><p>{run.period.label}</p></div>
            <p className="dash-issue-note">{issueNote(run)}</p><EventList run={run} />
          </div>
        </>
      );
    case "journal":
      return <Journal run={run} />;
    case "report":
      return <RunReport run={run} />;
  }
}

export function WorkspacePage({ section }: { section: DashboardSection | "setup" }) {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("WorkspacePage requires the dashboard layout");
  const { run, running, stage, baseHref, setDialog } = workspace;

  return (
    <>
      <div className="dash-title">
        <div>
          <h1>{section === "setup" ? "Кибердайджест" : dashboardSections[section]}</h1>
          <p>{section === "setup" ? "Соберите выпуск за 24 часа и проверьте источники."
            : section === "profile" ? "Управляйте данными локального демопрофиля." : run.period.label}</p>
        </div>
        {section === "setup" ? (
          <Link href={baseHref + "/digest"} className="dash-button">Открыть дайджест <ArrowRight size={16} aria-hidden="true" /></Link>
        ) : section !== "profile" && (
          <div className="dash-inline">
            <button type="button" className="dash-button" disabled={running} onClick={() => setDialog("send")}><PaperPlaneTilt size={16} /> Разослать (тест)</button>
            <button type="button" className="dash-button dash-button-primary" disabled={running} onClick={() => setDialog("export")}><DownloadSimple size={17} /> Выгрузить</button>
          </div>
        )}
      </div>
      {section === "setup" ? <Launch {...workspace} /> : section === "profile" ? <Profile /> : running ? (
        <RunProgress stage={stage} running={running} />
      ) : (
        <section className="dash-panel dash-result-content" aria-label="Результаты прогона">
          <Result section={section} run={run} />
        </section>
      )}
    </>
  );
}

export function Dashboard({ baseHref, homeHref, children }: { baseHref: string; homeHref: string; children: ReactNode }) {
  const workspace = useWorkspace(baseHref);
  const { dialog, setDialog, run, start, controlTime } = workspace;
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
    saveDemoAccount(null);
    window.location.replace(homeHref);
  }

  return (
    <WorkspaceContext.Provider value={workspace}>
      <div className="dash" lang="ru" dir="ltr">
        <aside className="dash-sidebar">
          <div className="dash-sidebar-brand">
            <Link className="header-wordmark" href={baseHref} aria-label="MONO" />
            <span>Рабочая область</span>
          </div>
          <nav className="dash-nav" aria-label="Рабочая область">
            <Link href={baseHref} aria-current={segment === null ? "page" : undefined}><SquaresFour size={18} aria-hidden="true" /> Запуск</Link>
            <p className="dash-side-label">Результаты</p>
            {results.map(({ id, icon: Icon }) => (
              <Link href={baseHref + "/" + id} key={id} aria-current={segment === id ? "page" : undefined}>
                <Icon size={18} aria-hidden="true" /> {dashboardSections[id]}
              </Link>
            ))}
            <p className="dash-side-label">Аккаунт</p>
            <Link href={baseHref + "/profile"} aria-current={segment === "profile" ? "page" : undefined}><UserCircle size={18} aria-hidden="true" /> Профиль</Link>
          </nav>
          <div className="dash-sidebar-end">
            <span className="dash-sidebar-state"><i /> Локальное демо</span>
            <AccountActions onSignOut={signOut} />
          </div>
        </aside>

        <main className="dash-main">
          <header className="dash-header">
            <div className="dash-breadcrumb">
              <SquaresFour size={16} aria-hidden="true" /><span>Рабочая область</span><CaretRight size={12} aria-hidden="true" />
              <strong>{dashboardSections[segment as DashboardSection] ?? "Запуск"}</strong>
            </div>
            <span className="dash-demo"><i /> Демо-режим</span>
          </header>
          <div className="dash-content">{children}</div>
        </main>

        {dialog === "export" && (
          <Dialog title="Выгрузить материалы" onClose={() => setDialog(null)}>
            <p className="dash-dialog-note">Файлы текущего демонстрационного выпуска.</p>
            <div className="dash-export-list">
              {getArtifacts(run).map(file => (
                <button type="button" className="dash-button" key={file.name} onClick={() => downloadFile(file)}>
                  <FileText size={16} /> {file.name}<DownloadSimple size={16} />
                </button>
              ))}
            </div>
          </Dialog>
        )}
        {dialog === "send" && <Dialog title="Тестовая рассылка" onClose={() => setDialog(null)}><SendForm /></Dialog>}
        {dialog === "article" && <Dialog title="Добавить публикацию" onClose={() => setDialog(null)}><ArticleForm controlTime={controlTime} onSubmit={start} /></Dialog>}
      </div>
    </WorkspaceContext.Provider>
  );
}
