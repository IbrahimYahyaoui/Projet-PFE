// frontend/src/api.ts
// Central fetch helper — injects auth token, parses JSON, throws on error

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchJson<T>(
  method: string,
  path: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message ?? j.error ?? msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const getToken = () => localStorage.getItem("token");

export const api = {
  get:    <T>(path: string, token?: string | null) =>
    fetchJson<T>("GET",    path, null,  token ?? getToken()),
  post:   <T>(path: string, body: unknown, token?: string | null) =>
    fetchJson<T>("POST",   path, body,  token ?? getToken()),
  put:    <T>(path: string, body: unknown, token?: string | null) =>
    fetchJson<T>("PUT",    path, body,  token ?? getToken()),
  delete: <T>(path: string, token?: string | null) =>
    fetchJson<T>("DELETE", path, null,  token ?? getToken()),
};
