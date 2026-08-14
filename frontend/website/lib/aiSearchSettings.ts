import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { config } from "@/config";

export type AiSearchProvider = "gemini" | "openrouter";

export interface AiSearchSettings {
  enabled: boolean;
  provider: AiSearchProvider;
  geminiApiKey: string | null;
  openrouterApiKey: string | null;
  hasGeminiApiKey: boolean;
  hasOpenrouterApiKey: boolean;
}

export interface AiSearchSettingsPublic {
  enabled: boolean;
  provider: AiSearchProvider;
  hasGeminiApiKey: boolean;
  hasOpenrouterApiKey: boolean;
}

type AiSearchSettingsRow = {
  enabled: boolean;
  provider: string;
  gemini_api_key: string | null;
  openrouter_api_key: string | null;
};

export type SaveAiSearchSettingsInput = {
  enabled: boolean;
  provider: AiSearchProvider;
  geminiApiKey: string | null;
  openrouterApiKey: string | null;
};

function emptySettings(): AiSearchSettings {
  return {
    enabled: false,
    provider: "gemini",
    geminiApiKey: null,
    openrouterApiKey: null,
    hasGeminiApiKey: false,
    hasOpenrouterApiKey: false,
  };
}

function mapRow(row: AiSearchSettingsRow): AiSearchSettings {
  const geminiApiKey = row.gemini_api_key?.trim() || null;
  const openrouterApiKey = row.openrouter_api_key?.trim() || null;
  return {
    enabled: Boolean(row.enabled),
    provider: row.provider === "openrouter" ? "openrouter" : "gemini",
    geminiApiKey,
    openrouterApiKey,
    hasGeminiApiKey: Boolean(geminiApiKey),
    hasOpenrouterApiKey: Boolean(openrouterApiKey),
  };
}

export async function getAiSearchSettings(): Promise<AiSearchSettings> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("ai_search_settings")
      .select("enabled, provider, gemini_api_key, openrouter_api_key")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return emptySettings();
    return mapRow(data as AiSearchSettingsRow);
  } catch {
    return emptySettings();
  }
}

export async function getAiSearchSettingsForAdmin(): Promise<AiSearchSettingsPublic> {
  const settings = await getAiSearchSettings();
  return {
    enabled: settings.enabled,
    provider: settings.provider,
    hasGeminiApiKey: settings.hasGeminiApiKey,
    hasOpenrouterApiKey: settings.hasOpenrouterApiKey,
  };
}

export function getAiSearchApiKey(settings: AiSearchSettings): string | null {
  return settings.provider === "openrouter"
    ? settings.openrouterApiKey
    : settings.geminiApiKey;
}

export async function validateAiSearchApiKey(
  provider: AiSearchProvider,
  apiKey: string,
): Promise<{ error?: string }> {
  const providerName = provider === "openrouter" ? "OpenRouter" : "Gemini";
  try {
    const response =
      provider === "openrouter"
        ? await fetch("https://openrouter.ai/api/v1/auth/key", {
            headers: { Authorization: `Bearer ${apiKey}` },
            cache: "no-store",
            signal: AbortSignal.timeout(15_000),
          })
        : await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.aiSearch.models.gemini}`,
            {
              headers: { "X-goog-api-key": apiKey },
              cache: "no-store",
              signal: AbortSignal.timeout(15_000),
            },
          );

    if (response.ok) return {};
    if (response.status === 401 || response.status === 403) {
      return { error: `The ${providerName} API key is invalid.` };
    }
    if (response.status === 429) {
      return {
        error: `${providerName} could not validate the key because its quota or rate limit was reached.`,
      };
    }
    return { error: `${providerName} could not validate this API key.` };
  } catch {
    return {
      error: `Could not reach ${providerName} to validate the API key. Try again.`,
    };
  }
}

export async function saveAiSearchSettingsRow(
  input: SaveAiSearchSettingsInput,
): Promise<{ error?: string }> {
  const admin = createSupabaseAdminClient();
  const { data: current } = await admin
    .from("ai_search_settings")
    .select("gemini_api_key, openrouter_api_key")
    .eq("id", 1)
    .maybeSingle();

  const existingGeminiKey =
    ((current?.gemini_api_key as string | null) ?? "").trim() || null;
  const existingOpenrouterKey =
    ((current?.openrouter_api_key as string | null) ?? "").trim() || null;
  const geminiApiKey = input.geminiApiKey?.trim() || existingGeminiKey;
  const openrouterApiKey =
    input.openrouterApiKey?.trim() || existingOpenrouterKey;
  const selectedApiKey =
    input.provider === "openrouter" ? openrouterApiKey : geminiApiKey;

  if (input.enabled && !selectedApiKey) {
    return {
      error: `${input.provider === "openrouter" ? "OpenRouter" : "Gemini"} API key is required when AI Search is enabled.`,
    };
  }

  const { error } = await admin.from("ai_search_settings").upsert(
    {
      id: 1,
      enabled: input.enabled,
      provider: input.provider,
      gemini_api_key: geminiApiKey,
      openrouter_api_key: openrouterApiKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    if (/ai_search_settings|schema cache|does not exist/i.test(error.message)) {
      return {
        error:
          "AI Search settings table is missing. Apply migration 0037_ai_search_settings.sql on Supabase, then try again.",
      };
    }
    return { error: error.message };
  }
  return {};
}
