// Formatting helpers: money, dates, status labels + tones.

import dayjs from "dayjs";
import "dayjs/locale/tr";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("tr");

export type Tone = "success" | "warning" | "error" | "info" | "neutral";

// Turkish status labels for the common codes across clients / invoices / orders / tickets.
const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  inactive: "Pasif",
  passive: "Pasif",
  blocked: "Engelli",
  blacklisted: "Kara Liste",
  paid: "Ödendi",
  unpaid: "Ödenmedi",
  refund: "İade",
  refunded: "İade",
  cancelled: "İptal",
  canceled: "İptal",
  collections: "Tahsilat",
  pending: "Bekliyor",
  processing: "İşlemde",
  process: "İşlemde",
  open: "Açık",
  waiting: "Yanıt Gerekiyor",
  answered: "Yanıtlandı",
  replied: "Yanıtlandı",
  solved: "Çözüldü",
  resolved: "Çözüldü",
  closed: "Kapandı",
  completed: "Tamamlandı",
  draft: "Taslak",
  suspended: "Askıda",
  terminated: "Sonlandırıldı",
  expired: "Süresi Doldu",
  fraud: "Dolandırıcılık",
};

export function statusLabel(status?: string | null): string {
  if (!status) return "-";
  const key = String(status).toLowerCase();
  return STATUS_LABELS[key] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

export function statusTone(status?: string | null): Tone {
  if (!status) return "neutral";
  const key = String(status).toLowerCase();
  if (["active", "paid", "solved", "resolved", "completed", "replied"].includes(key)) return "success";
  if (["pending", "processing", "process", "unpaid", "open", "answered", "draft"].includes(key))
    return "warning";
  if (["cancelled", "canceled", "refund", "refunded", "blocked", "blacklisted", "terminated", "expired", "fraud", "suspended", "waiting"].includes(key))
    return "error";
  if (["inactive", "passive", "closed"].includes(key)) return "neutral";
  return "info";
}

export function formatMoney(amount?: number | null, code?: string | null): string {
  if (amount === undefined || amount === null) return "-";
  const c = code ?? "";
  try {
    if (c) {
      return new Intl.NumberFormat("tr-TR", { style: "currency", currency: c, maximumFractionDigits: 2 }).format(
        amount,
      );
    }
  } catch {
    // Intl may not know the code; fall through to plain formatting.
  }
  const n = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(amount);
  return c ? `${n} ${c}` : n;
}

export function formatNumber(n?: number | null): string {
  if (n === undefined || n === null) return "-";
  return new Intl.NumberFormat("tr-TR").format(n);
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY") : "-";
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY HH:mm") : "-";
}

export function formatRelative(value?: string | null): string {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.fromNow() : "-";
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export function trustScoreLabel(label?: string | null): string {
  const map: Record<string, string> = { excellent: "Mükemmel", good: "İyi", average: "Orta", poor: "Zayıf", bad: "Kötü" };
  if (!label) return "-";
  return map[label.toLowerCase()] ?? label;
}

const PRIORITY_LABELS: Record<number, string> = { 1: "Düşük", 2: "Orta", 3: "Yüksek", 4: "Acil" };

export function priorityLabel(p?: number | null): string {
  if (p === undefined || p === null) return "-";
  return PRIORITY_LABELS[p] ?? `P${p}`;
}

export function priorityTone(p?: number | null): Tone {
  switch (p) {
    case 4:
      return "error";
    case 3:
      return "warning";
    case 2:
      return "info";
    default:
      return "neutral";
  }
}
