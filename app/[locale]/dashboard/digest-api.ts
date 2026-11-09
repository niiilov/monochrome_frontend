export const sampleDataset = "publications.json";
export const sampleControlTime = "2026-11-07T12:00";
export const maxEvents = 5;
export const uploadLimit = 8 * 1024 * 1024;
export const lastRunKey = "mono-digest-last-run";
export const pendingRunKey = "mono-digest-pending-run";

export function readRunId(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storeRunId(key: string, id: string | null) {
  try {
    if (id === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, id);
  } catch {}
}

export type Status = "включён" | "объединён" | "исключён";
export type ArticleDraft = {
  title: string;
  text: string;
  source: string;
  url: string;
  publishedAt: string;
};
export type Stage = { name: string; done: number; total: number };
export type RunStatus = {
  run_id: string;
  status: "running" | "done" | "failed";
  stage?: string;
  stages: Stage[];
  error?: string;
  dataset: string;
  control_time: string;
};

type Source = { article_id: string; name: string; url: string; date: string; role: string };
type DigestEvent = {
  n: number;
  event_id: string;
  title: string;
  essence: string;
  consequences: string;
  rationale: string;
  sources: Source[] | null;
};
type JournalEntry = {
  id: string;
  source: string;
  published_at_msk: string;
  status: Status;
  group: string;
  reason: string;
  error: string;
};
type Report = {
  duration_ms: number;
  llm: {
    provider: string;
    model: string;
    calls_total: number;
    input_tokens: number;
    output_tokens: number;
    cost: number | null;
  };
  counts: { total: number; events: number };
  prompts_hash: string;
  verify: { degraded: boolean; findings: { rule: string; message: string }[] };
};
type Digest = {
  events: DigestEvent[] | null;
  shortfall?: string;
  period: { start: string; end: string };
};
type Letter = { subject: string; text: string; html: string };

const moscowDateTime = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow", dateStyle: "short", timeStyle: "short",
});

function formatPeriod(start: number, end: number) {
  return moscowDateTime.format(start) + " → " + moscowDateTime.format(end) + " МСК";
}

export function getPeriod(controlTime: string) {
  const end = Date.parse(controlTime + ":00+03:00");
  if (!Number.isFinite(end)) return null;
  return formatPeriod(end - 86_400_000, end);
}

export function formatMoscowInput(value: string) {
  return moscowDateParts(new Date(value));
}

export function moscowNowInput() {
  return moscowDateParts(new Date());
}

function moscowDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(value);
  return parts.replace(" ", "T");
}

const base = "/api/digest/";
const runPath = (id: string) => base + encodeURIComponent(id);

class DigestApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function exportUrl(id: string) {
  return runPath(id) + "/export";
}

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new DigestApiError(body?.error || "Ошибка сервера (" + response.status + ").", response.status);
  }
  return response;
}

async function json<T>(url: string, signal?: AbortSignal) {
  const response = await request(url, { headers: { Accept: "application/json" }, signal });
  return response.json() as Promise<T>;
}

async function post<T>(url: string, body: FormData | object, signal?: AbortSignal) {
  const headers = new Headers({ "X-Mono-Digest": "1" });
  if (!(body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await request(url, {
    method: "POST", headers, body: body instanceof FormData ? body : JSON.stringify(body), signal,
  });
  return response.json() as Promise<T>;
}

export function createRun(controlTime: string, file: File | null, signal: AbortSignal, live = false) {
  const form = new FormData();
  form.set("control_time", controlTime + ":00+03:00");
  if (live) form.set("live", "true");
  else if (file) form.set("file", file);
  return post<{ run_id: string }>(base + "runs", form, signal);
}

export function addArticle(id: string, article: ArticleDraft, signal: AbortSignal) {
  return post<{ run_id: string }>(runPath(id) + "/articles", {
    title: article.title, text: article.text, source: article.source,
    url: article.url, published_at: article.publishedAt + ":00+03:00",
  }, signal);
}

export function getRunStatus(id: string, signal: AbortSignal) {
  return json<RunStatus>(runPath(id), signal);
}

export async function finishPendingRun(
  id: string,
  signal: AbortSignal,
  onStatus: (status: RunStatus) => void,
) {
  let current: RunStatus;
  try {
    current = await getRunStatus(id, signal);
    while (current.status === "running") {
      onStatus(current);
      await new Promise(resolve => setTimeout(resolve, 800));
      signal.throwIfAborted();
      current = await getRunStatus(id, signal);
    }
  } catch (error) {
    if (!signal.aborted && error instanceof DigestApiError && error.status === 404) {
      storeRunId(pendingRunKey, null);
    }
    throw error;
  }
  signal.throwIfAborted();
  if (current.status === "failed") {
    storeRunId(pendingRunKey, null);
    throw new Error(current.error || "Выпуск не удалось собрать.");
  }
  onStatus(current);
  const result = await loadRun(current, signal);
  signal.throwIfAborted();
  storeRunId(lastRunKey, result.id);
  storeRunId(pendingRunKey, null);
  return result;
}

export function checkSend(id: string, recipients: string[]) {
  return post<{ recipients: string[] }>(runPath(id) + "/send", { recipients });
}

export async function loadRun(status: RunStatus, signal: AbortSignal) {
  const path = runPath(status.run_id);
  const [digest, journal, report, letter, postText] = await Promise.all([
    json<Digest>(path + "/digest", signal),
    json<JournalEntry[] | null>(path + "/journal", signal),
    json<Report>(path + "/report", signal),
    json<Letter>(path + "/email", signal),
    request(path + "/post", { signal }).then(response => response.text()),
  ]);
  return {
    id: status.run_id,
    dataset: status.dataset,
    controlTime: formatMoscowInput(status.control_time),
    period: formatPeriod(Date.parse(digest.period.start), Date.parse(digest.period.end)),
    shortfall: digest.shortfall,
    events: (digest.events ?? []).map(event => ({
      group: event.event_id,
      title: event.title,
      summary: event.essence,
      impact: event.consequences,
      reason: event.rationale,
      sources: (event.sources ?? []).map(source => ({
        id: source.article_id, name: source.name, date: source.date, url: source.url, role: source.role,
      })),
    })),
    journal: journal ?? [],
    report,
    letter,
    post: postText,
  };
}

export type DigestRun = Awaited<ReturnType<typeof loadRun>>;
