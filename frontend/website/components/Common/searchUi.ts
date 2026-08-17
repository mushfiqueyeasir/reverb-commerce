export const OPEN_AI_SEARCH_EVENT = "reverb:open-ai-search";

export function openAiSearch(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_AI_SEARCH_EVENT));
}
