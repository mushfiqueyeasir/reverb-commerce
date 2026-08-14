import "server-only";

export const config = {
  aiStudio: {
    apiKey: process.env.GEMINI_API_KEY?.trim() ?? "",
    model: "gemini-3.5-flash",
  },
} as const;

export type AppConfig = typeof config;
