export const OPENROUTER_EMBEDDINGS_URL =
  "https://openrouter.ai/api/v1/embeddings";
export const OPENROUTER_EMBEDDING_MODEL = "nvidia/nemotron-3-embed-1b:free";
export const EMBEDDING_DIMENSIONS = 2048;
export const DEFAULT_BATCH_SIZE = 32;

export function parseBatchSize(value, fallback = DEFAULT_BATCH_SIZE) {
  const candidate = value === undefined ? fallback : value;
  if (
    (typeof candidate !== "string" && typeof candidate !== "number") ||
    !/^\d+$/.test(String(candidate))
  ) {
    throw new Error("Batch size must be a positive integer");
  }
  const parsed = Number(candidate);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error("Batch size must be a positive integer");
  }
  return parsed;
}

export function normalizeEmbeddingSources(rows) {
  if (!Array.isArray(rows)) {
    throw new Error("Embedding source RPC returned an invalid result");
  }
  return rows.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(`Embedding source ${index} is invalid`);
    }
    const productId =
      typeof row.product_id === "string" ? row.product_id.trim() : "";
    const sourceDocument =
      typeof row.source_document === "string" ? row.source_document : "";
    const model =
      typeof row.embedding_model === "string" ? row.embedding_model.trim() : "";
    if (!productId) {
      throw new Error(`Embedding source ${index} has no product_id`);
    }
    if (!sourceDocument.trim()) {
      throw new Error(`Embedding source ${index} has no source_document`);
    }
    if (model !== OPENROUTER_EMBEDDING_MODEL) {
      throw new Error(`Embedding source ${index} has an unsupported model`);
    }
    return {
      productId,
      sourceDocument,
      model,
      input: row.source_document,
    };
  });
}

function validateVector(vector, index) {
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding ${index} must contain exactly ${EMBEDDING_DIMENSIONS} dimensions`,
    );
  }
  if (
    !vector.every(
      (value) => typeof value === "number" && Number.isFinite(value),
    )
  ) {
    throw new Error(`Embedding ${index} contains a non-finite value`);
  }
  return vector;
}

export function parseOpenRouterEmbeddings(payload, expectedCount) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
    throw new Error("OpenRouter returned an invalid embeddings response");
  }
  if (payload.data.length !== expectedCount) {
    throw new Error(
      `OpenRouter returned ${payload.data.length} embeddings for ${expectedCount} inputs`,
    );
  }
  const hasIndexes = payload.data.map((item) => Number.isInteger(item?.index));
  if (hasIndexes.some(Boolean) && !hasIndexes.every(Boolean)) {
    throw new Error("OpenRouter returned inconsistent embedding indexes");
  }
  const ordered = hasIndexes.every(Boolean)
    ? payload.data.reduce((result, item) => {
        if (
          item.index < 0 ||
          item.index >= expectedCount ||
          result[item.index] !== undefined
        ) {
          throw new Error("OpenRouter returned invalid embedding indexes");
        }
        result[item.index] = item;
        return result;
      }, new Array(expectedCount))
    : payload.data;
  if (ordered.some((item) => item === undefined)) {
    throw new Error("OpenRouter returned incomplete embedding indexes");
  }
  return ordered.map((item, index) => validateVector(item?.embedding, index));
}

export async function requestOpenRouterEmbeddings(
  inputs,
  {
    apiKey,
    fetchImpl = globalThis.fetch,
    signal = AbortSignal.timeout(60_000),
  } = {},
) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error("At least one embedding input is required");
  }
  if (!inputs.every((input) => typeof input === "string" && input.trim())) {
    throw new Error("Embedding inputs must be non-empty strings");
  }
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("OPENROUTER_API_KEY is required");
  }
  let response;
  try {
    response = await fetchImpl(OPENROUTER_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_EMBEDDING_MODEL,
        input: inputs,
      }),
      signal,
    });
  } catch {
    throw new Error("OpenRouter embeddings request failed");
  }
  if (!response.ok) {
    throw new Error(
      `OpenRouter embeddings request failed (HTTP ${response.status})`,
    );
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("OpenRouter returned an invalid embeddings response");
  }
  return parseOpenRouterEmbeddings(payload, inputs.length);
}

export function buildStoredEmbeddingRows(sources, embeddings) {
  if (sources.length !== embeddings.length) {
    throw new Error("Embedding count does not match source count");
  }
  return sources.map((source, index) => ({
    product_id: source.productId,
    source_document: source.sourceDocument,
    model: source.model,
    embedding: validateVector(embeddings[index], index),
  }));
}

export async function syncProductEmbeddings({
  batchSize,
  getSources,
  embedInputs,
  storeEmbeddings,
  onBatch = () => {},
}) {
  const limit = parseBatchSize(batchSize);
  let batches = 0;
  let processed = 0;
  let previousSignature = "";
  for (;;) {
    const sources = normalizeEmbeddingSources(await getSources(limit));
    if (sources.length === 0) return { batches, processed };
    if (sources.length > limit) {
      throw new Error("Embedding source RPC exceeded the requested batch size");
    }
    const signature = JSON.stringify(
      sources
        .map((source) => `${source.productId}:${source.sourceDocument}`)
        .sort(),
    );
    if (signature === previousSignature) {
      throw new Error("Embedding source RPC repeated an unchanged batch");
    }
    const embeddings = await embedInputs(sources.map((source) => source.input));
    const storedRows = buildStoredEmbeddingRows(sources, embeddings);
    await storeEmbeddings(storedRows);
    previousSignature = signature;
    batches += 1;
    processed += storedRows.length;
    onBatch({ batch: batches, batchSize: storedRows.length, processed });
  }
}
