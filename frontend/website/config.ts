import "server-only";

/** Server-only configuration. Never import this module into a client component. */
export const config = {
  openRouter: {
    apiKey:
      "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",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
  },
} as const;

export type AppConfig = typeof config;
