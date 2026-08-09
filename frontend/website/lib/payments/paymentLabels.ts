import type { PaymentMethod, PaymentStatus } from "@/type/db";

export function paymentMethodLabel(method: string | null | undefined): string {
  const m = (method ?? "cod").toLowerCase();
  if (m === "bkash") return "bKash";
  if (m === "cod") return "Cash on delivery";
  return method || "Cash on delivery";
}

export function paymentStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "unpaid").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "processing") return "Processing";
  if (s === "failed") return "Failed";
  return "Unpaid";
}

export function normalizePaymentMethod(
  value: string | null | undefined,
): PaymentMethod {
  return value === "bkash" ? "bkash" : "cod";
}

export function normalizePaymentStatus(
  value: string | null | undefined,
): PaymentStatus {
  if (value === "processing" || value === "paid" || value === "failed")
    return value;
  return "unpaid";
}
