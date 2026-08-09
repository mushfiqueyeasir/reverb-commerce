import "server-only";

import nodemailer from "nodemailer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SmtpProvider = "gmail" | "smtp";

export interface SmtpSettings {
  enabled: boolean;
  provider: SmtpProvider;
  host: string | null;
  port: number;
  secure: boolean;
  username: string | null;
  /** Never send raw password to the client — only a flag. */
  hasPassword: boolean;
  password: string | null;
  fromName: string;
  fromEmail: string | null;
  notifyEmails: string[];
}

export interface SmtpSettingsPublic {
  enabled: boolean;
  provider: SmtpProvider;
  host: string | null;
  port: number;
  secure: boolean;
  username: string | null;
  hasPassword: boolean;
  fromName: string;
  fromEmail: string | null;
  notifyEmails: string[];
}

type SmtpRow = {
  enabled: boolean;
  provider: string;
  host: string | null;
  port: number | null;
  secure: boolean;
  username: string | null;
  password: string | null;
  from_name: string | null;
  from_email: string | null;
  notify_emails: string[] | null;
};

function emptySettings(): SmtpSettings {
  return {
    enabled: false,
    provider: "gmail",
    host: null,
    port: 587,
    secure: false,
    username: null,
    hasPassword: false,
    password: null,
    fromName: "Store",
    fromEmail: null,
    notifyEmails: [],
  };
}

function mapRow(row: SmtpRow): SmtpSettings {
  const password = (row.password ?? "").replace(/\s+/g, "") || null;
  return {
    enabled: Boolean(row.enabled),
    provider: row.provider === "smtp" ? "smtp" : "gmail",
    host: row.host?.trim() || null,
    port: Number(row.port) > 0 ? Number(row.port) : 587,
    secure: Boolean(row.secure),
    username: row.username?.trim() || null,
    hasPassword: Boolean(password),
    password,
    fromName: row.from_name?.trim() || "VE Gear",
    fromEmail: row.from_email?.trim() || row.username?.trim() || null,
    notifyEmails: Array.isArray(row.notify_emails)
      ? row.notify_emails.map((e) => String(e).trim()).filter(Boolean)
      : [],
  };
}

/** Full settings including password — server-only. */
export async function getSmtpSettings(): Promise<SmtpSettings> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("email_smtp_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return emptySettings();
    }

    if (!data) {
      return emptySettings();
    }

    return mapRow(data as SmtpRow);
  } catch {
    return emptySettings();
  }
}

/** Safe for admin UI — password never included. */
export async function getSmtpSettingsForAdmin(): Promise<SmtpSettingsPublic> {
  const full = await getSmtpSettings();
  return {
    enabled: full.enabled,
    provider: full.provider,
    host: full.host,
    port: full.port,
    secure: full.secure,
    username: full.username,
    hasPassword: full.hasPassword,
    fromName: full.fromName,
    fromEmail: full.fromEmail,
    notifyEmails: full.notifyEmails,
  };
}

export type SaveSmtpInput = {
  enabled: boolean;
  provider: SmtpProvider;
  host: string | null;
  port: number;
  secure: boolean;
  username: string | null;
  /** Empty / null means keep existing password. */
  password: string | null;
  fromName: string;
  fromEmail: string | null;
  notifyEmails: string[];
};

function smtpErrorMessage(error: unknown, provider: SmtpProvider): string {
  const details = error as {
    code?: string;
    responseCode?: number;
    command?: string;
  };
  if (details.code === "EAUTH" || details.responseCode === 535) {
    return provider === "gmail"
      ? "Gmail rejected the credentials. Confirm the Gmail address, enable 2-Step Verification, and use a current 16-character App Password."
      : "The SMTP server rejected the username or password.";
  }
  if (
    details.code === "ETIMEDOUT" ||
    details.code === "ECONNECTION" ||
    details.code === "ECONNREFUSED"
  ) {
    return "Could not connect to the mail server. Check the SMTP host, port, TLS mode, and network access.";
  }
  return "Could not verify the email configuration with the mail server.";
}

/** Authenticate with the provider without sending an email. */
export async function verifySmtpSettings(
  input: SaveSmtpInput,
): Promise<{ error?: string }> {
  if (!input.enabled) return {};

  const current = await getSmtpSettings();
  const user = input.username?.trim() || "";
  const pass =
    (input.password ?? "").replace(/\s+/g, "").trim() || current.password || "";
  if (!user || !pass) {
    return { error: "SMTP username and password are required." };
  }

  const transporter =
    input.provider === "smtp" && input.host?.trim()
      ? nodemailer.createTransport({
          host: input.host.trim(),
          port: input.port > 0 ? input.port : 587,
          secure: input.secure,
          requireTLS: !input.secure,
          auth: { user, pass },
          connectionTimeout: 15_000,
          greetingTimeout: 15_000,
          socketTimeout: 20_000,
        })
      : nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
          connectionTimeout: 15_000,
          greetingTimeout: 15_000,
          socketTimeout: 20_000,
          requireTLS: true,
        });

  try {
    await transporter.verify();
    return {};
  } catch (error) {
    return { error: smtpErrorMessage(error, input.provider) };
  } finally {
    transporter.close();
  }
}

export async function saveSmtpSettingsRow(
  input: SaveSmtpInput,
): Promise<{ error?: string }> {
  const admin = createSupabaseAdminClient();

  const { data: current } = await admin
    .from("email_smtp_settings")
    .select("password")
    .eq("id", 1)
    .maybeSingle();

  const existingPassword = ((current?.password as string | null) ?? "")
    .replace(/\s+/g, "")
    .trim();
  const nextPassword = (input.password ?? "").replace(/\s+/g, "").trim();
  const password = nextPassword || existingPassword || null;

  const payload = {
    id: 1,
    enabled: input.enabled,
    provider: input.provider,
    host: input.provider === "smtp" ? input.host?.trim() || null : null,
    port: input.port > 0 ? input.port : 587,
    secure: input.secure,
    username: input.username?.trim() || null,
    password,
    from_name: input.fromName.trim() || "VE Gear",
    from_email: input.fromEmail?.trim() || input.username?.trim() || null,
    notify_emails: input.notifyEmails.map((e) => e.trim()).filter(Boolean),
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("email_smtp_settings").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    if (
      /email_smtp_settings|schema cache|does not exist/i.test(error.message)
    ) {
      return {
        error:
          "Notification email settings table is missing. Apply migration 0015_email_smtp_settings.sql on Supabase, then try again.",
      };
    }
    return { error: error.message };
  }
  return {};
}
