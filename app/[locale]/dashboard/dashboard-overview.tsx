import Link from "next/link";
import type { ReactNode } from "react";
import {
  Article, ArrowDown, ArrowRight, BookOpen, ChartBar, DownloadSimple,
  FileText, Info, LinkSimple, ListChecks, WarningCircle,
} from "@phosphor-icons/react";
import { maxEvents, type DemoRun, type Status } from "./demo";

export function PageHint({ children }: { children: ReactNode }) {
  return (
    <aside className="dash-hint" aria-label="Подсказка к странице">
      <Info size={18} weight="bold" aria-hidden="true" />
      <p>{children}</p>
    </aside>
  );
}

export function QuickActions({ baseHref, running, onExport }: { baseHref: string; running: boolean; onExport: () => void }) {
  const links = [
    { path: "digest", label: "Открыть дайджест", description: "События и источники", icon: Article },
    { path: "journal", label: "Проверить журнал", description: "Решения по публикациям", icon: ListChecks },
    { path: "guide", label: "Читать инструкцию", description: "Пошаговый сценарий", icon: BookOpen },
  ];
  return (
    <section className="dash-overview-block" aria-labelledby="dash-quick-title">
      <h2 id="dash-quick-title">Быстрые действия</h2>
      <div className="dash-quick-grid">
        {links.map(({ path, label, description, icon: Icon }) => (
          <Link key={path} href={baseHref + "/" + path} className="dash-panel dash-quick-item">
            <Icon size={18} aria-hidden="true" />
            <span><strong>{label}</strong><small>{description}</small></span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ))}
        <button type="button" className="dash-panel dash-quick-item" disabled={running} onClick={onExport}>
          <DownloadSimple size={18} aria-hidden="true" />
          <span><strong>Скачать файлы</strong><small>Выпуск, журнал и отчёт</small></span>
          <ArrowDown size={15} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

const statusLabels: { status: Status; label: string; tone: string }[] = [
  { status: "включён", label: "Включены", tone: "included" },
  { status: "объединён", label: "Объединены", tone: "merged" },
  { status: "исключён", label: "Исключены", tone: "excluded" },
];

export function RunStatusChart({ run }: { run: DemoRun }) {
  const total = run.journal.length;
  const counts = statusLabels.map(item => ({
    ...item, count: run.journal.filter(row => row.status === item.status).length,
  }));
  return (
    <figure className="dash-chart">
      <figcaption><strong>Решения по публикациям</strong><span>Как распределились записи журнала</span></figcaption>
      <div className="dash-status-bar" aria-hidden="true">
        {counts.filter(item => item.count > 0).map(({ tone, count }) => (
          <span key={tone} data-tone={tone} style={{ flexGrow: count }} />
        ))}
      </div>
      <ul className="dash-chart-legend">
        {counts.map(({ label, tone, count }) => (
          <li key={tone}>
            <i data-tone={tone} aria-hidden="true" />
            <span>{label}</span>
            <strong>{count}</strong>
            <small>{total ? Math.round(count / total * 100) : 0}%</small>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function SourcesChart({ run }: { run: DemoRun }) {
  const max = Math.max(1, ...run.events.map(event => event.sources.length));
  return (
    <figure className="dash-chart">
      <figcaption><strong>Ссылки по событиям</strong><span>Сколько публикаций подтверждают или дополняют каждое событие</span></figcaption>
      <ol className="dash-source-bars">
        {run.events.map((event, index) => (
          <li key={event.group}>
            <span><small>{String(index + 1).padStart(2, "0")}</small> {event.title}</span>
            <div className="dash-source-track" aria-hidden="true">
              <span style={{ width: event.sources.length / max * 100 + "%" }} />
            </div>
            <strong><span className="dash-visually-hidden">Ссылок: </span>{event.sources.length}</strong>
          </li>
        ))}
      </ol>
    </figure>
  );
}

export function RunStatistics({ baseHref, run, running }: { baseHref: string; run: DemoRun; running: boolean }) {
  const sourceCount = new Set(run.events.flatMap(event => event.sources.map(source => source.name))).size;
  const errorCount = run.journal.filter(row => row.error).length;
  const metrics = [
    { label: "Событий в выпуске", value: run.events.length, suffix: " / " + maxEvents, icon: Article },
    { label: "Публикаций в журнале", value: run.journal.length, icon: FileText },
    { label: "Уникальных источников", value: sourceCount, icon: LinkSimple },
    { label: "Записей с ошибками", value: errorCount, icon: WarningCircle },
  ];

  return (
    <section className="dash-overview-block" aria-labelledby="dash-stats-title">
      <div className="dash-panel-head dash-stats-head">
        <div>
          <h2 id="dash-stats-title">Статистика выпуска</h2>
          <p>Последний завершённый демопрогон · {run.period.label}</p>
          {running && <p role="status">Обновится после завершения нового прогона.</p>}
        </div>
        <Link href={baseHref + "/report"} className="dash-button">
          <ChartBar size={16} aria-hidden="true" /> Отчёт о прогоне <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <div className="dash-metrics">
        {metrics.map(({ label, value, suffix, icon: Icon }, index) => (
          <article key={label} className={"dash-panel dash-metric" + (index === 0 ? " dash-metric-highlight" : "")}>
            <h3>{label}</h3><Icon className="dash-metric-icon" size={25} aria-hidden="true" />
            <p className="dash-metric-value">{value}{suffix && <span>{suffix}</span>}</p>
          </article>
        ))}
      </div>
      <div className="dash-chart-grid">
        <div className="dash-panel"><RunStatusChart run={run} /></div>
        <div className="dash-panel"><SourcesChart run={run} /></div>
      </div>
    </section>
  );
}

const guideSteps = [
  {
    title: "Настройте прогон",
    text: "На «Главном» оставьте демонабор или выберите файл JSON, JSONL или CSV. Задайте контрольное время по Москве. Период начинается за 24 часа до него.",
    path: "#run-settings", link: "К настройкам прогона",
  },
  {
    title: "Запустите обработку и проверьте выпуск",
    text: "Нажмите «Запустить» и дождитесь завершения. В дайджесте откройте источники и проверьте, что в тексте понятно, что произошло и кого это затронуло.",
    path: "/digest", link: "Открыть дайджест",
  },
  {
    title: "Разберите решения по материалам",
    text: "Журнал показывает причины отбора, объединения и исключения. Чтобы увидеть изменение в статистике, добавьте на «Главном» пример дубля и дождитесь нового результата.",
    path: "/journal", link: "Открыть журнал",
  },
  {
    title: "Подготовьте выпуск к распространению",
    text: "Для канала скопируйте «Пост», для рассылки проверьте «Письмо». В «Отчёте» можно выгрузить файлы и проверить сценарий рассылки.",
    path: "/report", link: "Открыть отчёт",
  },
];

export function DashboardGuide({ baseHref }: { baseHref: string }) {
  return (
    <div className="dash-guide">
      <section className="dash-panel dash-guide-intro">
        <h2>Для чего нужен MONO</h2>
        <p>MONO помогает командам информационной безопасности собрать за сутки короткий выпуск для коллег и партнёров. Дайджест объединяет публикации об одном событии и сохраняет ссылки, чтобы читатель мог проверить первоисточники.</p>
      </section>
      <section className="dash-panel dash-guide-steps">
        <h2>От набора публикаций до выпуска</h2>
        <ol>
          {guideSteps.map(({ title, text, path, link }, index) => (
            <li key={title}>
              <span className="dash-event-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link href={baseHref + path}>{link} <ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="dash-panel dash-guide-intro">
        <h2>Что работает в деморежиме</h2>
        <p>Выпуск строится на вымышленных публикациях. У загруженного файла учитывается имя, содержимое файла не обрабатывается. Пробная рассылка проверяет сценарий без отправки письма.</p>
      </section>
    </div>
  );
}
