import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "./khudebarta";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_PER_HOUR = 5;

export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  if (digits.startsWith("1")) return `880${digits}`;
  return digits ? `880${digits}` : "";
}

export function isValidBdPhone(raw: string): boolean {
  return /^8801[3-9]\d{8}$/.test(normalizePhone(raw));
}

function hashCode(code: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

type OtpRow = {
  id: string;
  phone: string;
  code_hash: string;
  salt: string;
  expires_at: string;
  attempts: number;
  used: boolean;
};

/**
 * Generates a code, stores its salted hash, and sends the OTP SMS. The message
 * may contain a {code} placeholder that is replaced with the generated code.
 */
export async function sendCheckoutOtp(
  rawPhone: string,
  message: string,
): Promise<{ error?: string }> {
  const normalized = normalizePhone(rawPhone);
  if (!isValidBdPhone(normalized)) {
    return { error: "Please enter a valid Bangladeshi mobile number." };
  }

  const admin = createSupabaseAdminClient();

  const { data: latest } = await admin
    .from("sms_otps")
    .select("id, created_at")
    .eq("phone", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) {
    const elapsed =
      Date.now() - new Date(latest.created_at as string).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const remaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        error: `Please wait ${remaining}s before requesting a new code.`,
      };
    }
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("sms_otps")
    .select("id", { count: "exact", head: true })
    .eq("phone", normalized)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return { error: "Too many code requests. Please try again later." };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const salt = randomBytes(16).toString("hex");

  const { error: insertError } = await admin.from("sms_otps").insert({
    phone: normalized,
    code_hash: hashCode(code, salt),
    salt,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    used: false,
  });
  if (insertError) return { error: "Could not send the verification code." };

  try {
    await sendSms({
      to: normalized,
      message: message.replaceAll("{code}", code),
    });
    return {};
  } catch (error) {
    await admin
      .from("sms_otps")
      .delete()
      .eq("phone", normalized)
      .eq("code_hash", hashCode(code, salt));
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to send the verification code.",
    };
  }
}

export async function verifyOtp(
  rawPhone: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizePhone(rawPhone);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("sms_otps")
    .select("id, code_hash, salt, expires_at, attempts, used")
    .eq("phone", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: "Could not verify the code." };
  if (!data) {
    return {
      ok: false,
      error: "No code was sent to this number. Request a new one.",
    };
  }

  const row = data as OtpRow;
  if (row.used) {
    return { ok: false, error: "This code has already been used." };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Request a new one." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false,
      error: "Too many incorrect attempts. Request a new code.",
    };
  }

  const match = hashCode(String(code).trim(), row.salt) === row.code_hash;
  if (match) {
    await admin.from("sms_otps").delete().eq("phone", normalized);
    return { ok: true };
  }

  await admin
    .from("sms_otps")
    .update({ attempts: row.attempts + 1 })
    .eq("id", row.id);
  return { ok: false, error: "Incorrect code. Please try again." };
}
