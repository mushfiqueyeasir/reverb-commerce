import "server-only";

/** Server-only configuration. Never import this module into a client component. */
export const config = {
  openRouter: {
    apiKey:
      "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",
    model: "openai/gpt-4o-mini",
  },
} as const;

export type AppConfig = typeof config;
