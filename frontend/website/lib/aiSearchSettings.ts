import "server-only";

import Groq from "groq-sdk";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { config } from "@/config";

export type AiSearchProvider = "gemini" | "openrouter" | "groq";

export interface AiSearchSettings {
  enabled: boolean;
  provider: AiSearchProvider;
  geminiApiKey: string | null;
  openrouterApiKey: string | null;
  groqApiKey: string | null;
  hasGeminiApiKey: boolean;
  hasOpenrouterApiKey: boolean;
  hasGroqApiKey: boolean;
}

export interface AiSearchSettingsPublic {
  enabled: boolean;
  provider: AiSearchProvider;
  hasGeminiApiKey: boolean;
  hasOpenrouterApiKey: boolean;
  hasGroqApiKey: boolean;
}

type AiSearchSettingsRow = {
  enabled: boolean;
  provider: string;
  gemini_api_key: string | null;
  openrouter_api_key: string | null;
  groq_api_key: string | null;
};

export type SaveAiSearchSettingsInput = {
  enabled: boolean;
  provider: AiSearchProvider;
  geminiApiKey: string | null;
  openrouterApiKey: string | null;
  groqApiKey: string | null;
};

function providerName(provider: AiSearchProvider): string {
  if (provider === "openrouter") return "OpenRouter";
  if (provider === "groq") return "Groq";
  return "Gemini";
}

function normalizeProvider(provider: string): AiSearchProvider {
  if (provider === "openrouter" || provider === "groq") return provider;
  return "gemini";
}

function emptySettings(): AiSearchSettings {
  return {
    enabled: false,
    provider: "gemini",
    geminiApiKey: null,
    openrouterApiKey: null,
    groqApiKey: null,
    hasGeminiApiKey: false,
    hasOpenrouterApiKey: false,
    hasGroqApiKey: false,
  };
}

function mapRow(row: AiSearchSettingsRow): AiSearchSettings {
  const geminiApiKey = row.gemini_api_key?.trim() || null;
  const openrouterApiKey = row.openrouter_api_key?.trim() || null;
  const groqApiKey = row.groq_api_key?.trim() || null;
  return {
    enabled: Boolean(row.enabled),
    provider: normalizeProvider(row.provider),
    geminiApiKey,
    openrouterApiKey,
    groqApiKey,
    hasGeminiApiKey: Boolean(geminiApiKey),
    hasOpenrouterApiKey: Boolean(openrouterApiKey),
    hasGroqApiKey: Boolean(groqApiKey),
  };
}

export async function getAiSearchSettings(): Promise<AiSearchSettings> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("ai_search_settings")
      .select(
        "enabled, provider, gemini_api_key, openrouter_api_key, groq_api_key",
      )
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
    hasGroqApiKey: settings.hasGroqApiKey,
  };
}

export function getAiSearchApiKey(settings: AiSearchSettings): string | null {
  if (settings.provider === "openrouter") return settings.openrouterApiKey;
  if (settings.provider === "groq") return settings.groqApiKey;
  return settings.geminiApiKey;
}

export async function validateAiSearchApiKey(
  provider: AiSearchProvider,
  apiKey: string,
): Promise<{ error?: string }> {
  const name = providerName(provider);
  try {
    if (provider === "groq") {
      const groq = new Groq({ apiKey, timeout: 15_000, maxRetries: 0 });
      await groq.models.retrieve(config.aiSearch.models.groq);
      return {};
    }

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
      return { error: `The ${name} API key is invalid.` };
    }
    if (response.status === 429) {
      return {
        error: `${name} could not validate the key because its quota or rate limit was reached.`,
      };
    }
    return { error: `${name} could not validate this API key.` };
  } catch (error) {
    if (error instanceof Groq.AuthenticationError) {
      return { error: "The Groq API key is invalid." };
    }
    if (error instanceof Groq.PermissionDeniedError) {
      return {
        error:
          "This Groq API key does not have permission to use the required model.",
      };
    }
    if (error instanceof Groq.RateLimitError) {
      return {
        error:
          "Groq could not validate the key because its quota or rate limit was reached.",
      };
    }
    return {
      error: `Could not reach ${name} to validate the API key. Try again.`,
    };
  }
}

export async function saveAiSearchSettingsRow(
  input: SaveAiSearchSettingsInput,
): Promise<{ error?: string }> {
  const admin = createSupabaseAdminClient();
  const { data: current } = await admin
    .from("ai_search_settings")
    .select("gemini_api_key, openrouter_api_key, groq_api_key")
    .eq("id", 1)
    .maybeSingle();

  const existingGeminiKey =
    ((current?.gemini_api_key as string | null) ?? "").trim() || null;
  const existingOpenrouterKey =
    ((current?.openrouter_api_key as string | null) ?? "").trim() || null;
  const existingGroqKey =
    ((current?.groq_api_key as string | null) ?? "").trim() || null;
  const geminiApiKey = input.geminiApiKey?.trim() || existingGeminiKey;
  const openrouterApiKey =
    input.openrouterApiKey?.trim() || existingOpenrouterKey;
  const groqApiKey = input.groqApiKey?.trim() || existingGroqKey;
  const selectedApiKey =
    input.provider === "openrouter"
      ? openrouterApiKey
      : input.provider === "groq"
        ? groqApiKey
        : geminiApiKey;

  if (input.enabled && !selectedApiKey) {
    return {
      error: `${providerName(input.provider)} API key is required when AI Search is enabled.`,
    };
  }

  const { error } = await admin.from("ai_search_settings").upsert(
    {
      id: 1,
      enabled: input.enabled,
      provider: input.provider,
      gemini_api_key: geminiApiKey,
      openrouter_api_key: openrouterApiKey,
      groq_api_key: groqApiKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    if (/ai_search_settings|schema cache|does not exist/i.test(error.message)) {
      return {
        error:
          "AI Search settings are missing. Apply the latest Supabase migrations, then try again.",
      };
    }
    return { error: error.message };
  }
  return {};
}
