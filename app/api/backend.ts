export function allowedOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") return false;
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  const publicOrigin = (process.env.APP_PUBLIC_URL || "https://monochrome-digital.online").replace(/\/+$/, "");
  return origin === publicOrigin || origin === new URL(request.url).origin;
}

export async function forwardBackend(request: Request, path: string, init: RequestInit = {}) {
  if (!allowedOrigin(request)) return Response.json({ error: "Запрос с другого сайта запрещён." }, { status: 403 });
  const headers = new Headers(init.headers);
  for (const name of ["Cookie", "Authorization", "Accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Origin is checked above, before forwarding to the private Go service.
  const origin = (process.env.DIGEST_API_URL || "http://backend:8080").replace(/\/+$/, "");
  try {
    const response = await fetch(origin + "/api/v1/" + path, { ...init, headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(120_000) });
    const outgoing = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    for (const name of ["Content-Type", "Content-Disposition"]) {
      const value = response.headers.get(name);
      if (value) outgoing.set(name, value);
    }
    for (const cookie of response.headers.getSetCookie()) outgoing.append("Set-Cookie", cookie);
    if (outgoing.get("Content-Type")?.startsWith("text/html")) outgoing.set("Content-Security-Policy", "sandbox; default-src 'none'; style-src 'unsafe-inline'");
    return new Response(response.body, { status: response.status, headers: outgoing });
  } catch { return Response.json({ error: "Сервис временно недоступен. Попробуйте ещё раз." }, { status: 502 }); }
}
