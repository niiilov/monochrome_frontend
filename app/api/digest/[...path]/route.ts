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
  return forward(id + (action ? "/" + action : ""), {
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
    if (typeof controlTime !== "string" || !Number.isFinite(Date.parse(controlTime))) {
      return problem("Укажите контрольное время.", 400);
    }

    const form = new FormData();
    form.set("control_time", controlTime);
    if (file instanceof File) {
      if (!file.size || !/\.(jsonl?|csv)$/i.test(file.name)) {
        return problem("Выберите непустой файл JSON, JSONL или CSV.", 400);
      }
      if (file.size > uploadLimit) return problem("Размер файла превышает 8 МБ.", 413);
      form.set("file", file);
    } else {
      form.set("dataset", defaultDataset);
    }
    return forward("", { method: "POST", body: form });
  }

  if (!validID(id) || extra.length || (action !== "articles" && action !== "send")) {
    return problem("Неизвестный запрос.", 404);
  }

  const input = await request.json().catch(() => null);
  if (!input || typeof input !== "object") return problem("Некорректные данные.", 400);

  const body = action === "send"
    ? { recipients: input.recipients, dry_run: true }
    : { title: input.title, text: input.text, source: input.source, url: input.url, published_at: input.published_at };
  return forward(id + "/" + action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validID(id: string) {
  return /^[a-z0-9_-]{1,80}$/i.test(id);
}

async function forward(path: string, init: RequestInit) {
  const origin = (process.env.DIGEST_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");
  try {
    const response = await fetch(origin + "/api/v1/runs" + (path ? "/" + path : ""), {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
    });
    const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    for (const name of ["Content-Type", "Content-Disposition"]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (headers.get("Content-Type")?.startsWith("text/html")) {
      headers.set("Content-Security-Policy", "sandbox; default-src 'none'; style-src 'unsafe-inline'");
    }
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return problem("Сервер дайджеста недоступен. Проверьте, что Go API запущен, и повторите попытку.", 502);
  }
}
