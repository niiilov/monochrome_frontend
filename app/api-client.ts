export type Account = { id: string; email: string; name: string; email_verified: boolean; keywords: string[] };
export type Recipient = { id: string; email: string; status: "send" | "skip"; created_at: string };
export type SendResult = { mode: "all" | "selected"; dry_run: boolean; results: { email: string; result: string; error?: string }[] };

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly data: unknown) { super(message); }
}

export async function apiRequest<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/v1/" + path, {
    method, credentials: "same-origin", cache: "no-store", signal,
    headers: body === undefined ? { Accept: "application/json" } : { "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== "auth/login" && typeof window !== "undefined") window.dispatchEvent(new Event("mono-session-expired"));
    throw new ApiError(data?.error || data?.message || "Не удалось выполнить запрос. Попробуйте ещё раз.", response.status, data);
  }
  return data as T;
}
