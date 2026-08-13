import { describe, expect, it, vi } from "vitest";
import { createNoStoreSupabaseFetch } from "./noStoreFetch";

function captureFetch() {
  const requests: Request[] = [];
  const fetchImplementation = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(input, init));
      return new Response(null, { status: 204 });
    },
  );
  return { fetchImplementation: fetchImplementation as typeof fetch, requests };
}

describe("createNoStoreSupabaseFetch", () => {
  it.each(["sb_publishable_public", "sb_secret_private"])(
    "removes a matching modern API key bearer for %s",
    async (apiKey) => {
      const { fetchImplementation, requests } = captureFetch();
      const supabaseFetch = createNoStoreSupabaseFetch(
        apiKey,
        fetchImplementation,
      );

      await supabaseFetch("https://example.supabase.co/rest/v1/items", {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(requests[0].headers.get("apikey")).toBe(apiKey);
      expect(requests[0].headers.get("authorization")).toBeNull();
      expect(requests[0].cache).toBe("no-store");
    },
  );

  it("preserves a user access token with a modern publishable key", async () => {
    const apiKey = "sb_publishable_public";
    const { fetchImplementation, requests } = captureFetch();
    const supabaseFetch = createNoStoreSupabaseFetch(
      apiKey,
      fetchImplementation,
    );

    await supabaseFetch("https://example.supabase.co/auth/v1/user", {
      headers: {
        apikey: apiKey,
        Authorization: "Bearer user.jwt.token",
      },
    });

    expect(requests[0].headers.get("authorization")).toBe(
      "Bearer user.jwt.token",
    );
  });

  it("preserves the bearer fallback for a legacy JWT key", async () => {
    const apiKey = "header.payload.signature";
    const { fetchImplementation, requests } = captureFetch();
    const supabaseFetch = createNoStoreSupabaseFetch(
      apiKey,
      fetchImplementation,
    );

    await supabaseFetch("https://example.supabase.co/rest/v1/items", {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    });

    expect(requests[0].headers.get("authorization")).toBe(`Bearer ${apiKey}`);
  });

  it("preserves Request headers when init does not replace them", async () => {
    const apiKey = "sb_publishable_public";
    const { fetchImplementation, requests } = captureFetch();
    const supabaseFetch = createNoStoreSupabaseFetch(
      apiKey,
      fetchImplementation,
    );
    const request = new Request("https://example.supabase.co/rest/v1/items", {
      headers: { "x-request": "request" },
    });

    await supabaseFetch(request);

    expect(requests[0].headers.get("x-request")).toBe("request");
  });

  it("uses init headers instead of stale Request headers", async () => {
    const apiKey = "sb_publishable_public";
    const { fetchImplementation, requests } = captureFetch();
    const supabaseFetch = createNoStoreSupabaseFetch(
      apiKey,
      fetchImplementation,
    );
    const request = new Request("https://example.supabase.co/rest/v1/items", {
      headers: { authorization: "Bearer stale", "x-request": "request" },
    });

    await supabaseFetch(request, { headers: { "x-init": "init" } });

    expect(requests[0].headers.get("authorization")).toBeNull();
    expect(requests[0].headers.get("x-request")).toBeNull();
    expect(requests[0].headers.get("x-init")).toBe("init");
  });
});
