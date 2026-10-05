// Thin typed WISECP Admin API client over fetch. Decodes the envelope, tracks
// rate limits, maps errors. NEVER retries on 401. The single place requests go.

import { ApiError, statusToCode } from "./errors";
import { rateLimiter } from "./rateLimiter";
import { getSession, normalizeBaseUrl } from "./session";

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

function buildQuery(query?: QueryParams): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? "?" + parts.join("&") : "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: QueryParams;
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
  // Override base URL / key (used during the connect flow before a session exists).
  baseUrlOverride?: string;
  keyOverride?: string | null;
}

export async function apiRequest<T = any>(path: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
  const session = getSession();
  const baseUrl = opts.baseUrlOverride ?? session.baseUrl;
  const apiKey = opts.keyOverride !== undefined ? opts.keyOverride : session.apiKey;

  if (!baseUrl) {
    throw new ApiError("no_connection", "Panel bağlantısı yok.");
  }

  await rateLimiter.acquire();

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const method = opts.method ?? "GET";
  let bodyStr: string | undefined;
  if (opts.body !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json";
    bodyStr = JSON.stringify(opts.body);
  }
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const url = baseUrl + path + buildQuery(opts.query);

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: bodyStr, signal: opts.signal });
  } catch {
    throw new ApiError("network", "Sunucuya ulaşılamadı.");
  }

  rateLimiter.update(res.headers);

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "5");
    rateLimiter.block(retryAfter);
    throw new ApiError("rate_limited", "İstek limiti aşıldı.", 429, null, retryAfter);
  }

  let json: any = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok || (json && json.error)) {
    const err = json?.error ?? {};
    const code = err.code ?? statusToCode(res.status);
    const message = err.message ?? "İstek başarısız oldu.";
    const details = err.details ?? null;
    throw new ApiError(code, message, res.status, details);
  }

  return { data: json?.data as T, meta: json?.meta };
}

// Health check — no key required. Used by the connect flow to verify the URL.
export async function pingPanel(rawUrl: string): Promise<{ pong: boolean; version: string; time: string }> {
  const baseUrl = normalizeBaseUrl(rawUrl);
  const res = await apiRequest<{ pong: boolean; version: string; time: string }>("/ping", {
    baseUrlOverride: baseUrl,
    keyOverride: null,
  });
  return res.data;
}

// Key identity — verifies the key and returns its permissions.
export async function whoami(rawUrl: string, key: string): Promise<WhoAmI> {
  const baseUrl = normalizeBaseUrl(rawUrl);
  const res = await apiRequest<WhoAmI>("/whoami", { baseUrlOverride: baseUrl, keyOverride: key });
  return res.data;
}

export interface WhoAmI {
  id: number;
  type: string;
  name: string;
  permissions: string[];
  last_access?: string;
}

export function idempotencyKey(): string {
  return `wa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
