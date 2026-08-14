import "server-only";

/** Server-only configuration. Never import this module into a client component. */
export const config = {
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY?.trim() ?? "",
    model: "google/gemini-2.5-flash-lite",
  },
} as const;

export type AppConfig = typeof config;
