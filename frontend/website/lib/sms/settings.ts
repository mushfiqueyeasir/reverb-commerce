import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface SmsSettings {
  enabled: boolean;
  senderId: string | null;
  apiKey: string | null;
  secretKey: string | null;
  checkoutOtp: boolean;
  hasApiKey: boolean;
  hasSecretKey: boolean;
}

export interface SmsSettingsPublic {
  enabled: boolean;
  senderId: string | null;
  checkoutOtp: boolean;
  hasApiKey: boolean;
  hasSecretKey: boolean;
}

type SmsRow = {
  enabled: boolean;
  sender_id: string | null;
  api_key: string | null;
  secret_key: string | null;
  checkout_otp: boolean;
};

function emptySettings(): SmsSettings {
  return {
    enabled: false,
    senderId: null,
    apiKey: null,
    secretKey: null,
    checkoutOtp: false,
    hasApiKey: false,
    hasSecretKey: false,
  };
}

function mapRow(row: SmsRow): SmsSettings {
  const apiKey = (row.api_key ?? "").trim() || null;
  const secretKey = (row.secret_key ?? "").trim() || null;
  return {
    enabled: Boolean(row.enabled),
    senderId: row.sender_id?.trim() || null,
    apiKey,
    secretKey,
    checkoutOtp: Boolean(row.checkout_otp),
    hasApiKey: Boolean(apiKey),
    hasSecretKey: Boolean(secretKey),
  };
}

/** Full settings including secrets — server-only. */
export async function getSmsSettings(): Promise<SmsSettings> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("sms_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return emptySettings();
    return mapRow(data as SmsRow);
  } catch {
    return emptySettings();
  }
}

/** Safe for admin UI — secrets never included. */
export async function getSmsSettingsForAdmin(): Promise<SmsSettingsPublic> {
  const full = await getSmsSettings();
  return {
    enabled: full.enabled,
    senderId: full.senderId,
    checkoutOtp: full.checkoutOtp,
    hasApiKey: full.hasApiKey,
    hasSecretKey: full.hasSecretKey,
  };
}

export type SaveSmsInput = {
  enabled: boolean;
  senderId: string | null;
  apiKey: string | null;
  /** Empty / null means keep existing. */
  secretKey: string | null;
  checkoutOtp: boolean;
};

export async function saveSmsSettingsRow(
  input: SaveSmsInput,
): Promise<{ error?: string }> {
  const admin = createSupabaseAdminClient();

  const { data: current } = await admin
    .from("sms_settings")
    .select("api_key, secret_key")
    .eq("id", 1)
    .maybeSingle();

  const existingApiKey = ((current?.api_key as string | null) ?? "").trim();
  const existingSecretKey = (
    (current?.secret_key as string | null) ?? ""
  ).trim();
  const nextApiKey = (input.apiKey ?? "").trim();
  const nextSecretKey = (input.secretKey ?? "").trim();

  const payload = {
    id: 1,
    enabled: input.enabled,
    sender_id: input.senderId?.trim() || null,
    api_key: nextApiKey || existingApiKey || null,
    secret_key: nextSecretKey || existingSecretKey || null,
    checkout_otp: input.checkoutOtp,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("sms_settings").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    if (/sms_settings|schema cache|does not exist/i.test(error.message)) {
      return {
        error:
          "SMS settings table is missing. Apply migration 0047_sms_otp_settings.sql on Supabase, then try again.",
      };
    }
    return { error: error.message };
  }
  return {};
}

export function isSmsReady(settings: SmsSettings): boolean {
  return Boolean(
    settings.enabled &&
    settings.senderId &&
    settings.apiKey &&
    settings.secretKey,
  );
}
