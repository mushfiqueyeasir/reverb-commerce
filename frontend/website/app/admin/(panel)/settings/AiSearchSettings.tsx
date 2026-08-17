"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, adminInputClass } from "@/components/admin/FormField";
import { cn } from "@/lib/utils";
import type {
  AiSearchProvider,
  AiSearchSettingsPublic,
} from "@/lib/aiSearchSettings";
import {
  activateAiSearchProvider,
  connectAiSearchProvider,
  disableAiSearch,
} from "./actions";

export interface AiSearchDraft extends AiSearchSettingsPublic {
  geminiApiKey: string;
  openrouterApiKey: string;
  groqApiKey: string;
  aihubmixApiKey: string;
}

export function aiSearchDraftFromPublic(
  settings: AiSearchSettingsPublic,
): AiSearchDraft {
  return {
    ...settings,
    geminiApiKey: "",
    openrouterApiKey: "",
    groqApiKey: "",
    aihubmixApiKey: "",
  };
}

function GeminiIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2c.72 5.34 4.66 9.28 10 10-5.34.72-9.28 4.66-10 10-.72-5.34-4.66-9.28-10-10 5.34-.72 9.28-4.66 10-10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function OpenRouterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 7h9.5a4.5 4.5 0 0 1 4.5 4.5V17m0 0-3-3m3 3 3-3M3 17h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GroqIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18.6 8.2A7.5 7.5 0 1 0 19.5 12v-1.2H12v3h4.1A4.5 4.5 0 1 1 16 9.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AihubmixIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="5" cy="7" r="2" fill="currentColor" />
      <circle cx="19" cy="7" r="2" fill="currentColor" />
      <circle cx="5" cy="17" r="2" fill="currentColor" />
      <circle cx="19" cy="17" r="2" fill="currentColor" />
      <path
        d="m7 8 3 2m4 0 3-2m-7 6-3 2m7-2 3 2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const PROVIDERS: {
  id: AiSearchProvider;
  label: string;
  description: string;
  icon: typeof GeminiIcon;
}[] = [
  {
    id: "gemini",
    label: "Gemini",
    description: "Connect with a Google AI Studio key",
    icon: GeminiIcon,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Connect with an OpenRouter key",
    icon: OpenRouterIcon,
  },
  {
    id: "groq",
    label: "Groq",
    description: "Connect with a GroqCloud key",
    icon: GroqIcon,
  },
  {
    id: "aihubmix",
    label: "AIHubMix",
    description: "Connect with an AIHubMix key",
    icon: AihubmixIcon,
  },
];

export function AiSearchSettings({
  value,
  onChange,
}: {
  value: AiSearchDraft;
  onChange: (value: AiSearchDraft) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedProviderId, setSelectedProviderId] =
    useState<AiSearchProvider>(value.provider);
  const selectedProvider =
    PROVIDERS.find((provider) => provider.id === selectedProviderId) ??
    PROVIDERS[0];
  const activeProvider =
    PROVIDERS.find((provider) => provider.id === value.provider) ??
    PROVIDERS[0];
  const providerName = selectedProvider.label;
  const ActiveProviderIcon = activeProvider.icon;
  const apiKey =
    selectedProviderId === "openrouter"
      ? value.openrouterApiKey
      : selectedProviderId === "groq"
        ? value.groqApiKey
        : selectedProviderId === "aihubmix"
          ? value.aihubmixApiKey
          : value.geminiApiKey;
  const hasSavedApiKey =
    selectedProviderId === "openrouter"
      ? value.hasOpenrouterApiKey
      : selectedProviderId === "groq"
        ? value.hasGroqApiKey
        : selectedProviderId === "aihubmix"
          ? value.hasAihubmixApiKey
          : value.hasGeminiApiKey;
  const isSelectedProviderActive =
    value.enabled && value.provider === selectedProviderId;

  const setApiKey = (nextApiKey: string) => {
    if (selectedProviderId === "openrouter") {
      onChange({ ...value, openrouterApiKey: nextApiKey });
      return;
    }
    if (selectedProviderId === "groq") {
      onChange({ ...value, groqApiKey: nextApiKey });
      return;
    }
    if (selectedProviderId === "aihubmix") {
      onChange({ ...value, aihubmixApiKey: nextApiKey });
      return;
    }
    onChange({ ...value, geminiApiKey: nextApiKey });
  };

  const connect = () => {
    const nextApiKey = apiKey.trim();
    if (!nextApiKey) {
      toast.error(`Enter a ${providerName} API key.`);
      return;
    }

    startTransition(async () => {
      const result = await connectAiSearchProvider({
        provider: selectedProviderId,
        apiKey: nextApiKey,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      onChange({
        ...value,
        enabled: true,
        provider: selectedProviderId,
        geminiApiKey: "",
        openrouterApiKey: "",
        groqApiKey: "",
        aihubmixApiKey: "",
        hasGeminiApiKey:
          value.hasGeminiApiKey || selectedProviderId === "gemini",
        hasOpenrouterApiKey:
          value.hasOpenrouterApiKey || selectedProviderId === "openrouter",
        hasGroqApiKey: value.hasGroqApiKey || selectedProviderId === "groq",
        hasAihubmixApiKey:
          value.hasAihubmixApiKey || selectedProviderId === "aihubmix",
      });
      toast.success(`${providerName} connected. AI Search is now enabled.`);
      router.refresh();
    });
  };

  const activate = () => {
    if (!hasSavedApiKey || isSelectedProviderActive) return;

    startTransition(async () => {
      const result = await activateAiSearchProvider(selectedProviderId);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      onChange({
        ...value,
        enabled: true,
        provider: selectedProviderId,
        geminiApiKey: "",
        openrouterApiKey: "",
        groqApiKey: "",
        aihubmixApiKey: "",
      });
      toast.success(`${providerName} is now active for AI Search.`);
      router.refresh();
    });
  };

  const submitProvider = () => {
    if (apiKey.trim()) {
      connect();
      return;
    }
    activate();
  };

  const disconnect = () => {
    startTransition(async () => {
      const result = await disableAiSearch();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      onChange({
        ...value,
        enabled: false,
        geminiApiKey: "",
        openrouterApiKey: "",
        groqApiKey: "",
        aihubmixApiKey: "",
      });
      toast.success("AI Search disabled");
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Connect Gemini, OpenRouter, Groq, or AIHubMix with your own API key. The
        key is validated before AI Search is enabled and remains server-side.
      </p>

      {value.enabled ? (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <ActiveProviderIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium">AI Search is enabled</p>
              <p className="text-xs text-muted-foreground">
                Connected with {activeProvider.label}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={disconnect}
            disabled={pending}
            className="rounded-full"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Power className="size-4" />
            )}
            Disable
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card/50 px-4 py-3">
          <p className="text-sm font-medium">AI Search is disabled</p>
          <p className="text-xs text-muted-foreground">
            Saved provider connections are retained and can be activated below.
          </p>
        </div>
      )}

      <FormField label={value.enabled ? "Change provider or key" : "Provider"}>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const connected =
              provider.id === "openrouter"
                ? value.hasOpenrouterApiKey
                : provider.id === "groq"
                  ? value.hasGroqApiKey
                  : provider.id === "aihubmix"
                    ? value.hasAihubmixApiKey
                    : value.hasGeminiApiKey;
            const active = value.enabled && value.provider === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedProviderId(provider.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                  selectedProviderId === provider.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card/60 hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    selectedProviderId === provider.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-sm font-medium">
                    {provider.label}
                    {connected ? (
                      <span className="text-xs font-medium text-emerald-600">
                        {active ? "Active" : "Connected"}
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {provider.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField
        label={`${providerName} API key`}
        hint={
          hasSavedApiKey
            ? "A key is saved. Enter a new key only to replace it."
            : "The key will be verified with the provider before it is saved."
        }
      >
        <Input
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={
            hasSavedApiKey
              ? `Enter a new ${providerName} key to replace the saved key`
              : `${providerName} API key`
          }
          className={adminInputClass}
          autoComplete="new-password"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitProvider();
            }
          }}
        />
      </FormField>

      <Button
        type="button"
        onClick={submitProvider}
        disabled={
          pending ||
          (!apiKey.trim() && (!hasSavedApiKey || isSelectedProviderActive))
        }
        className="rounded-full px-6"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {apiKey.trim()
          ? `Validate and use ${providerName}`
          : isSelectedProviderActive
            ? `${providerName} is active`
            : hasSavedApiKey
              ? `Use ${providerName}`
              : `Connect ${providerName}`}
      </Button>
    </div>
  );
}
