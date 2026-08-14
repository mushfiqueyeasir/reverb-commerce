import "server-only";

export const config = {
  aiSearch: {
    models: {
      gemini: "gemini-3.5-flash",
      openrouter: "nvidia/nemotron-3-super-120b-a12b:free",
      groq: "openai/gpt-oss-20b",
    },
  },
} as const;

export type AppConfig = typeof config;
