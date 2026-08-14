export const OPENROUTER_EMBEDDINGS_URL =
  "https://openrouter.ai/api/v1/embeddings";
export const AI_ADVISOR_EMBEDDING_MODEL = "nvidia/nemotron-3-embed-1b:free";
export const AI_ADVISOR_EMBEDDING_DIMENSIONS = 2048;

export function parseAdvisorEmbedding(payload: unknown): number[] | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length !== 1) return null;
  const embedding = (data[0] as { embedding?: unknown } | undefined)?.embedding;
  if (!Array.isArray(embedding)) return null;
  if (embedding.length !== AI_ADVISOR_EMBEDDING_DIMENSIONS) return null;
  if (
    !embedding.every(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    )
  ) {
    return null;
  }
  return embedding;
}

export async function requestAdvisorEmbedding(
  input: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number[]> {
  if (!input.trim()) throw new Error("Embedding input is required.");
  if (!apiKey.trim()) throw new Error("Embedding API key is required.");
  const response = await fetchImpl(OPENROUTER_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_ADVISOR_EMBEDDING_MODEL,
      input,
    }),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Embedding provider returned HTTP ${response.status}.`);
  }
  const embedding = parseAdvisorEmbedding(await response.json());
  if (!embedding) throw new Error("Embedding provider returned invalid data.");
  return embedding;
}
