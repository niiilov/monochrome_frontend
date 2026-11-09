import { forwardBackend } from "../../backend";

const uploadLimit = 8 * 1024 * 1024;
const readable = new Set(["", "digest", "post", "email", "journal", "report", "export"]);
const defaultDataset = "testdata/train/publications.json";

function problem(error: string, status: number) {
  return Response.json({ error }, { status });
}

type DigestRouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: DigestRouteContext) {
  const [id, action = "", ...extra] = (await context.params).path;
  if (!validID(id) || extra.length || !readable.has(action)) {
    return problem("Неизвестный запрос.", 404);
  }
  return forward(request, id + (action ? "/" + action : ""), {
    headers: { Accept: request.headers.get("Accept") || "application/json" },
  });
}

export async function POST(request: Request, context: DigestRouteContext) {
  if (request.headers.get("X-Mono-Digest") !== "1") {
    return problem("Недопустимый запрос.", 403);
  }

  const [id, action, ...extra] = (await context.params).path;
  if (id === "runs" && !action) {
    if (Number(request.headers.get("Content-Length")) > uploadLimit + 65536) {
      return problem("Размер файла превышает 8 МБ.", 413);
    }

    const input = await request.formData().catch(() => null);
    const controlTime = input?.get("control_time");
    const file = input?.get("file");
    const live = input?.get("live") === "true";
    if (typeof controlTime !== "string" || !Number.isFinite(Date.parse(controlTime))) {
      return problem("Укажите контрольное время.", 400);
    }

    const form = new FormData();
    form.set("control_time", controlTime);
    if (live) form.set("live", "true");
    if (!live && file instanceof File) {
      if (!file.size || !/\.(jsonl?|csv)$/i.test(file.name)) {
        return problem("Выберите непустой файл JSON, JSONL или CSV.", 400);
      }
      if (file.size > uploadLimit) return problem("Размер файла превышает 8 МБ.", 413);
      form.set("file", file);
    } else if (!live) {
      form.set("dataset", defaultDataset);
    }
    return forward(request, "", { method: "POST", body: form });
  }

  if (!validID(id) || extra.length || (action !== "articles" && action !== "send")) {
    return problem("Неизвестный запрос.", 404);
  }

  const input = await request.json().catch(() => null);
  if (!input || typeof input !== "object") return problem("Некорректные данные.", 400);

  const body = action === "send"
    ? { mode: input.mode, recipient_ids: input.recipient_ids, ...(typeof input.dry_run === "boolean" ? { dry_run: input.dry_run } : {}) }
    : { title: input.title, text: input.text, source: input.source, url: input.url, published_at: input.published_at };
  return forward(request, id + "/" + action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validID(id: string) {
  return /^[a-z0-9_-]{1,80}$/i.test(id);
}

async function forward(request: Request, path: string, init: RequestInit) {
  return forwardBackend(request, "runs" + (path ? "/" + path : ""), init);
}
