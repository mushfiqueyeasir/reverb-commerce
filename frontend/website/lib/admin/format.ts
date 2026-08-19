import { format, formatDistanceToNow } from "date-fns";
import type { OrderStatus } from "@/type/db";

// Currency — symbol comes from site_settings; default $.
export function formatMoney(value: number | string, symbol = "$"): string {
  const n = typeof value === "string" ? Number(value) : value;
  const safe = Number.isFinite(n) ? n : 0;
  return `${symbol}${safe.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return (Number.isFinite(n) ? n : 0).toLocaleString();
}

export function formatDate(value: string | Date): string {
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

export function formatDateTime(value: string | Date): string {
  try {
    return format(new Date(value), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "—";
  }
}

export function timeAgo(value: string | Date): string {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return "—";
  }
}

// Semantic-token badge classes for order statuses (globals.css). Tuned for dark + Daylight.
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-info/15 text-info border-info/30",
  processing: "bg-progress/15 text-progress border-progress/30",
  shipped: "bg-shipped/15 text-shipped border-shipped/30",
  delivered: "bg-success/15 text-success border-success/30",
  cancelled: "bg-danger/15 text-danger border-danger/30",
};

// Allowed forward transitions for the order workflow.
// Delivered is final (no cancel). Cancelling any earlier status restocks variants.
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Convert an array of flat objects into a downloadable CSV string.
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}
