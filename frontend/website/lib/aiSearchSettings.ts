import "server-only";

import Groq from "groq-sdk";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { config } from "@/config";

export type AiSearchProvider =
  | "gemini"
  | "openrouter"
  | "groq"
  | "aihubmix";

export interface AiSearchSettings {
  enabled: boolean;
  provider: AiSearchProvider;
  geminiApiKey: string | null;
  openrouterApiKey: string | null;
  groqApiKey: string | null;
  aihubmixApiKey: string | null;
  hasGeminiApiKey: boolean;
  hasOpenrouterApiKey: boolean;
  hasGroqApiKey: boolean;
  hasAihubmixApiKey: boolean;
}

export interface AiSearchSettingsPublic {
  enabled: boolean;
  provider: AiSearchProvider;
  hasGeminiApiKey: boolean;
  hasOpenrouterApiKey: boolean;
  hasGroqApiKey: boolean;
  hasAihubmixApiKey: boolean;
}

type AiSearchSettingsRow = {
  enabled: boolean;
  provider: string;
  gemini_api_key: string | null;
  openrouter_api_key: string | null;
  groq_api_key: string | null;
  aihubmix_api_key: string | null;
};

export type SaveAiSearchSettingsInput = {
  enabled: boolean;
  provider: AiSearchProvider;
  geminiApiKey: string | null;
  openrouterApiKey: string | null;
  groqApiKey: string | null;
  aihubmixApiKey: string | null;
};

function providerName(provider: AiSearchProvider): string {
  if (provider === "openrouter") return "OpenRouter";
  if (provider === "groq") return "Groq";
  if (provider === "aihubmix") return "AIHubMix";
  return "Gemini";
}

function normalizeProvider(provider: string): AiSearchProvider {
  if (
    provider === "openrouter" ||
    provider === "groq" ||
    provider === "aihubmix"
  ) {
    return provider;
  }
  return "gemini";
}

function emptySettings(): AiSearchSettings {
  return {
    enabled: false,
    provider: "gemini",
    geminiApiKey: null,
    openrouterApiKey: null,
    groqApiKey: null,
    aihubmixApiKey: null,
    hasGeminiApiKey: false,
    hasOpenrouterApiKey: false,
    hasGroqApiKey: false,
    hasAihubmixApiKey: false,
  };
}

function mapRow(row: AiSearchSettingsRow): AiSearchSettings {
  const geminiApiKey = row.gemini_api_key?.trim() || null;
  const openrouterApiKey = row.openrouter_api_key?.trim() || null;
  const groqApiKey = row.groq_api_key?.trim() || null;
  const aihubmixApiKey = row.aihubmix_api_key?.trim() || null;
  return {
    enabled: Boolean(row.enabled),
    provider: normalizeProvider(row.provider),
    geminiApiKey,
    openrouterApiKey,
    groqApiKey,
    aihubmixApiKey,
    hasGeminiApiKey: Boolean(geminiApiKey),
    hasOpenrouterApiKey: Boolean(openrouterApiKey),
    hasGroqApiKey: Boolean(groqApiKey),
    hasAihubmixApiKey: Boolean(aihubmixApiKey),
  };
}

export async function getAiSearchSettings(): Promise<AiSearchSettings> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("ai_search_settings")
      .select(
        "enabled, provider, gemini_api_key, openrouter_api_key, groq_api_key, aihubmix_api_key",
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
    hasAihubmixApiKey: settings.hasAihubmixApiKey,
  };
}

export function getAiSearchApiKey(settings: AiSearchSettings): string | null {
  if (settings.provider === "openrouter") return settings.openrouterApiKey;
  if (settings.provider === "groq") return settings.groqApiKey;
  if (settings.provider === "aihubmix") return settings.aihubmixApiKey;
  return settings.geminiApiKey;
}

export async function validateAiSearchApiKey(
  provider: AiSearchProvider,
  apiKey: string,
): Promise<{ error?: string }> {
  const name = providerName(provider);
  try {
    if (provider === "aihubmix") {
      const response = await fetch("https://aihubmix.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.aiSearch.models.aihubmix,
          messages: [{ role: "user", content: "Reply with OK." }],
          max_completion_tokens: 128,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        const providerError = (await response.json().catch(() => null)) as {
          error?: { message?: string } | string;
          message?: string;
        } | null;
        const providerMessage =
          typeof providerError?.error === "string"
            ? providerError.error
            : providerError?.error?.message ?? providerError?.message;
        if (response.status === 401) {
          return { error: "The AIHubMix API key is invalid or expired." };
        }
        if (response.status === 403) {
          return {
            error:
              "AIHubMix rejected the API key because of permissions or account balance.",
          };
        }
        if (response.status === 429) {
          return {
            error:
              "AIHubMix could not validate the key because its rate limit was reached.",
          };
        }
        return {
          error: providerMessage
            ? `AIHubMix rejected validation: ${providerMessage.replace(/\s+/g, " ").slice(0, 300)}`
            : `AIHubMix could not validate this API key or model access (${response.status}).`,
        };
      }
      return {};
    }

    if (provider === "groq") {
      const groq = new Groq({ apiKey, timeout: 15_000, maxRetries: 0 });
      const models = await groq.models.list();
      if (
        !models.data.some((model) => model.id === config.aiSearch.models.groq)
      ) {
        return {
          error:
            "The Groq API key is valid but does not have access to the required model.",
        };
      }
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
    if (error instanceof Groq.APIError && error.status) {
      return {
        error: `Groq rejected API key validation (${error.status}): ${error.message}`,
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
    .select(
      "gemini_api_key, openrouter_api_key, groq_api_key, aihubmix_api_key",
    )
    .eq("id", 1)
    .maybeSingle();

  const existingGeminiKey =
    ((current?.gemini_api_key as string | null) ?? "").trim() || null;
  const existingOpenrouterKey =
    ((current?.openrouter_api_key as string | null) ?? "").trim() || null;
  const existingGroqKey =
    ((current?.groq_api_key as string | null) ?? "").trim() || null;
  const existingAihubmixKey =
    ((current?.aihubmix_api_key as string | null) ?? "").trim() || null;
  const geminiApiKey = input.geminiApiKey?.trim() || existingGeminiKey;
  const openrouterApiKey =
    input.openrouterApiKey?.trim() || existingOpenrouterKey;
  const groqApiKey = input.groqApiKey?.trim() || existingGroqKey;
  const aihubmixApiKey =
    input.aihubmixApiKey?.trim() || existingAihubmixKey;
  const selectedApiKey =
    input.provider === "openrouter"
      ? openrouterApiKey
      : input.provider === "groq"
        ? groqApiKey
        : input.provider === "aihubmix"
          ? aihubmixApiKey
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
      aihubmix_api_key: aihubmixApiKey,
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
