import { allowedOrigin, forwardBackend } from "../../backend";
type Context = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: Context) {
  if (!allowedOrigin(request)) return Response.json({ error: "Запрос с другого сайта запрещён." }, { status: 403 });
  const parts = (await context.params).path;
  const auth = parts[0] === "auth" && parts.length === 2 && ["register", "login", "logout", "me", "verify-email", "resend-verification"].includes(parts[1]);
  const recipients = parts[0] === "recipients" && parts.length <= 2;
  const sources = parts[0] === "sources" && parts.length <= 2;
  const runs = parts[0] === "runs" && parts.length <= 3;
  if (!(auth || recipients || sources || runs) || !parts.every(part => /^[a-zA-Z0-9_-]{1,100}$/.test(part))) return Response.json({ error: "Неизвестный запрос." }, { status: 404 });
  const limit = 64 * 1024;
  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method) && request.body) {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) { await reader.cancel(); return Response.json({ error: "Слишком большой запрос." }, { status: 413 }); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    body = new ArrayBuffer(size);
    const bytes = new Uint8Array(body);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  }
  const headers = new Headers();
  const type = request.headers.get("Content-Type");
  if (type) headers.set("Content-Type", type);
  return forwardBackend(request, parts.join("/") + new URL(request.url).search, { method: request.method, headers, body });
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
