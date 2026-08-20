import "server-only";

import { getSmsSettings, isSmsReady, type SmsSettings } from "./settings";

const BASE_URL = "http://portal.khudebarta.com:3775";

function parseResponse(text: string): { ok: boolean; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true };
  const lower = trimmed.toLowerCase();

  const failureMarkers = [
    "error",
    "failed",
    "fail",
    "invalid",
    "unauthorized",
    "denied",
    "not allowed",
    "insufficient",
  ];
  if (failureMarkers.some((marker) => lower.includes(marker))) {
    return { ok: false, error: trimmed.slice(0, 200) };
  }

  try {
    const json = JSON.parse(trimmed) as Record<string, unknown>;
    const status = String(
      json.status ?? json.statusCode ?? json.code ?? "",
    ).toLowerCase();
    if (["error", "fail", "failed"].includes(status)) {
      return {
        ok: false,
        error:
          typeof json.message === "string"
            ? json.message.slice(0, 200)
            : typeof json.msg === "string"
              ? json.msg.slice(0, 200)
              : trimmed.slice(0, 200),
      };
    }
  } catch {
    // Plain text success response.
  }
  return { ok: true };
}

export async function sendSms(input: {
  to: string;
  message: string;
  settings?: SmsSettings;
}): Promise<void> {
  const settings = input.settings ?? (await getSmsSettings());
  if (!isSmsReady(settings)) {
    throw new Error("SMS gateway is not configured or not enabled.");
  }

  const body = new URLSearchParams({
    callerID: settings.senderId as string,
    apikey: settings.apiKey as string,
    secretkey: settings.secretKey as string,
    toUser: input.to,
    messageContent: input.message,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE_URL}/sendtext`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
    });
    const text = await res.text();
    const parsed = parseResponse(text);
    if (!res.ok || !parsed.ok) {
      throw new Error(
        parsed.error || `Khudebarta SMS request failed (${res.status}).`,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Khudebarta SMS request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
