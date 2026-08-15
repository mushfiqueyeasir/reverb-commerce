import { isSafeChromeHref } from "@/lib/cms/siteChrome";

export function safeKawaiiHref(
  value: string | null | undefined,
  fallback: string,
) {
  const href = value?.trim() || "";
  return isSafeChromeHref(href) ? href : fallback;
}
