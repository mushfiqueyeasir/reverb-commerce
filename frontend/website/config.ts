import "server-only";

export const config = {
  aiStudio: {
    apiKey: "AQ.Ab8RN6Kr93ifaaGCSObe92lzF9bw-mlyfaUzUXVy1f_l2xZLqA",
    model: "gemini-3.5-flash",
  },
} as const;

export type AppConfig = typeof config;
