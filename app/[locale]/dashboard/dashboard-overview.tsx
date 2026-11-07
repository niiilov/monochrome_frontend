import Link from "next/link";
import {
  Article, ArrowRight, ChartBar, DownloadSimple,
  FileText, LinkSimple, ListChecks, WarningCircle,
} from "@phosphor-icons/react";
import { maxEvents, type DigestRun, type Status } from "./digest-api";

export function LatestIssue({ baseHref, run, running, onExport }: {
  baseHref: string;
  run: DigestRun;
  running: boolean;
  onExport: () => void;
}) {
  const hasEvents = run.events.length > 0;
  const summary = hasEvents
    ? "Сверьте события с источниками перед публикацией."
    : "Обработка завершена. В журнале указано, почему публикации не вошли в выпуск.";

  return (
    <section className="dash-panel dash-latest" aria-labelledby="dash-latest-title">
      <div>
        <h2 id="dash-latest-title">Последний выпуск</h2>
        <p className="dash-issue-meta">{run.dataset} · {run.period}</p>
      </div>
      <p role="status">{running ? "Готовится новый выпуск. Ниже статистика предыдущего." : summary}</p>
      {!running && (
        <div className="dash-inline">
          <Link href={baseHref + (hasEvents ? "/digest" : "/journal")} className="dash-button dash-button-primary">
            {hasEvents ? <Article size={16} aria-hidden="true" /> : <ListChecks size={16} aria-hidden="true" />}
            {hasEvents ? "Открыть дайджест" : "Посмотреть причины в журнале"}
          </Link>
          <Link href={baseHref + (hasEvents ? "/journal" : "/digest")} className="dash-button">
            {hasEvents ? "Журнал обработки" : "Открыть дайджест"}
          </Link>
          <button type="button" className="dash-button" onClick={onExport}>
            <DownloadSimple size={16} aria-hidden="true" /> Скачать материалы
          </button>
        </div>
      )}
    </section>
  );
}

const statusLabels: { status: Status; label: string; tone: string }[] = [
  { status: "включён", label: "Включены", tone: "included" },
  { status: "объединён", label: "Объединены", tone: "merged" },
  { status: "исключён", label: "Исключены", tone: "excluded" },
];

export function RunStatusChart({ run }: { run: DigestRun }) {
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

function SourcesChart({ run }: { run: DigestRun }) {
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

export function RunStatistics({ baseHref, run }: { baseHref: string; run: DigestRun }) {
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
        </div>
        <Link href={baseHref + "/report"} className="dash-button">
          <ChartBar size={16} aria-hidden="true" /> Отчёт о запуске <ArrowRight size={15} aria-hidden="true" />
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
        {run.events.length > 0 && <div className="dash-panel"><SourcesChart run={run} /></div>}
      </div>
    </section>
  );
}
