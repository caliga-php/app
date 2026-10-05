// In-memory session the ApiClient reads on every request. The connection store
// (src/store/connection.tsx) is the single writer; set it at startup and on
// connect/switch/disconnect. The API key never lands in general storage or logs.

type Session = { baseUrl: string | null; apiKey: string | null };

let current: Session = { baseUrl: null, apiKey: null };

export function setSession(baseUrl: string | null, apiKey: string | null): void {
  current = { baseUrl, apiKey };
}

export function getSession(): Session {
  return current;
}

// Turn whatever the user typed into a clean admin base URL.
//   "vexa.net.tr"                    -> "https://vexa.net.tr/api/v1/admin"
//   "https://vexa.net.tr/"           -> "https://vexa.net.tr/api/v1/admin"
//   "https://vexa.net.tr/api/v1/..." -> "https://vexa.net.tr/api/v1/admin"
export function normalizeBaseUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/api\/v1\/(admin|client)?$/i, "");
  return url + "/api/v1/admin";
}
