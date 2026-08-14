import "server-only";

/** Server-only configuration. Never import this module into a client component. */
export const config = {
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY?.trim() ?? "",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
  },
} as const;

export type AppConfig = typeof config;
