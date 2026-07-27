const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? res.statusText);
  }
  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`).then(handle<T>);
}

export function apiJson<T>(method: string, path: string, data: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(handle<T>);
}

export function apiForm<T>(method: string, path: string, form: FormData): Promise<T> {
  return fetch(`${API_BASE}${path}`, { method, body: form }).then(handle<T>);
}

export function apiDelete(path: string): Promise<void> {
  return fetch(`${API_BASE}${path}`, { method: "DELETE" }).then(handle<void>);
}
