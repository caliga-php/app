// Typed API error + Turkish messages. UI branches on `code`, never on text.

export class ApiError extends Error {
  code: string;
  status: number;
  details: Record<string, string> | null;
  retryAfter: number | null;

  constructor(
    code: string,
    message: string,
    status = 0,
    details: Record<string, string> | null = null,
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

const MESSAGES: Record<string, string> = {
  no_connection: "Panel bağlantısı yok. Önce bir panel ekleyin.",
  network: "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.",
  missing_token: "API anahtarı gönderilmedi.",
  invalid_token: "API anahtarı geçersiz. Panelden anahtarı kontrol edin.",
  audience_mismatch: "Bu anahtar admin yüzeyine ait değil (wak_ ile başlamalı).",
  insufficient_scope: "Bu işlem için anahtarın yetkisi yok.",
  demo_mode: "Panel demo modunda; yazma işlemleri reddedildi.",
  ip_not_allowed: "İsteğiniz izin verilen IP adreslerinin dışından geldi.",
  rate_limited: "İstek limiti aşıldı. Lütfen biraz bekleyin.",
  too_many_auth_failures: "Çok fazla hatalı deneme. IP geçici olarak engellendi.",
  validation_failed: "Girilen bilgiler doğrulanamadı.",
  not_found: "Kayıt bulunamadı.",
  payload_too_large: "Gönderilen veri çok büyük.",
  conflict: "Aynı istek hâlâ işleniyor. Birazdan tekrar deneyin.",
  server_error: "Sunucuda bir hata oluştu. Lütfen sonra tekrar deneyin.",
  unknown: "Beklenmeyen bir hata oluştu.",
};

export function messageForError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "insufficient_scope" && err.message) return err.message;
    if (err.code === "validation_failed" && err.message) return err.message;
    return MESSAGES[err.code] ?? err.message ?? MESSAGES.unknown;
  }
  return MESSAGES.unknown;
}

export function statusToCode(status: number): string {
  switch (status) {
    case 401:
      return "invalid_token";
    case 403:
      return "insufficient_scope";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 413:
      return "payload_too_large";
    case 422:
      return "validation_failed";
    case 429:
      return "rate_limited";
    default:
      return status >= 500 ? "server_error" : "unknown";
  }
}
