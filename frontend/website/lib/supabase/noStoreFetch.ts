/**
 * Next.js caches `fetch` by default. Supabase uses fetch for PostgREST GETs,
 * so wrap every server-side Supabase client with this to always hit the DB.
 */
export function createNoStoreSupabaseFetch(
  apiKey: string,
  fetchImplementation: typeof fetch = fetch,
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : {}),
    );
    if (
      (apiKey.startsWith("sb_publishable_") ||
        apiKey.startsWith("sb_secret_")) &&
      headers.get("authorization") === `Bearer ${apiKey}`
    ) {
      headers.delete("authorization");
    }
    return fetchImplementation(input, {
      ...init,
      headers,
      cache: "no-store",
    });
  };
}
