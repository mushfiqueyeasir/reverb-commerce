import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_BATCH_SIZE,
  EMBEDDING_DIMENSIONS,
  OPENROUTER_EMBEDDING_MODEL,
  OPENROUTER_EMBEDDINGS_URL,
  buildStoredEmbeddingRows,
  normalizeEmbeddingSources,
  parseBatchSize,
  parseOpenRouterEmbeddings,
  requestOpenRouterEmbeddings,
  syncProductEmbeddings,
} from "./product-embeddings-core.mjs";
import {
  SOURCE_RPC,
  STORE_RPC,
  createEmbeddingRpcOperations,
} from "./sync-product-embeddings.mjs";

function vector(value) {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, () => value);
}

function source(productId, sourceDocument = `input-${productId}`) {
  return {
    product_id: productId,
    source_document: sourceDocument,
    embedding_model: OPENROUTER_EMBEDDING_MODEL,
  };
}

test("parseBatchSize accepts positive integers", () => {
  assert.equal(parseBatchSize(undefined), DEFAULT_BATCH_SIZE);
  assert.equal(parseBatchSize("17"), 17);
  assert.equal(parseBatchSize(4), 4);
  for (const value of [true, "", "0", "1.5", "-2", "nope"]) {
    assert.throws(() => parseBatchSize(value), /positive integer/);
  }
});

test("normalizeEmbeddingSources validates the source RPC contract", () => {
  assert.deepEqual(
    normalizeEmbeddingSources([
      {
        product_id: " product-1 ",
        source_document: " Product one ",
        embedding_model: OPENROUTER_EMBEDDING_MODEL,
      },
      source("product-2", "Product two"),
    ]),
    [
      {
        productId: "product-1",
        sourceDocument: " Product one ",
        model: OPENROUTER_EMBEDDING_MODEL,
        input: " Product one ",
      },
      {
        productId: "product-2",
        sourceDocument: "Product two",
        model: OPENROUTER_EMBEDDING_MODEL,
        input: "Product two",
      },
    ],
  );
  assert.throws(() => normalizeEmbeddingSources([source("")]), /product_id/);
  assert.throws(
    () => normalizeEmbeddingSources([source("product", "")]),
    /source_document/,
  );
  assert.throws(
    () =>
      normalizeEmbeddingSources([
        {
          ...source("product"),
          embedding_model: "unsupported/model",
        },
      ]),
    /unsupported model/,
  );
});

test("parseOpenRouterEmbeddings orders results and enforces 2048 dimensions", () => {
  const first = vector(1);
  const second = vector(2);
  assert.deepEqual(
    parseOpenRouterEmbeddings(
      {
        data: [
          { index: 1, embedding: second },
          { index: 0, embedding: first },
        ],
      },
      2,
    ),
    [first, second],
  );
  assert.throws(
    () =>
      parseOpenRouterEmbeddings(
        { data: [{ index: 0, embedding: first.slice(1) }] },
        1,
      ),
    /exactly 2048 dimensions/,
  );
  const invalid = vector(1);
  invalid[20] = Number.NaN;
  assert.throws(
    () =>
      parseOpenRouterEmbeddings(
        { data: [{ index: 0, embedding: invalid }] },
        1,
      ),
    /non-finite/,
  );
});

test("requestOpenRouterEmbeddings batches inputs with the required model", async () => {
  let request;
  const embeddings = await requestOpenRouterEmbeddings(["one", "two"], {
    apiKey: "test-key",
    signal: undefined,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { index: 0, embedding: vector(1) },
            { index: 1, embedding: vector(2) },
          ],
        }),
      };
    },
  });
  assert.equal(request.url, OPENROUTER_EMBEDDINGS_URL);
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.deepEqual(JSON.parse(request.options.body), {
    model: OPENROUTER_EMBEDDING_MODEL,
    input: ["one", "two"],
  });
  assert.equal(embeddings.length, 2);
});

test("requestOpenRouterEmbeddings does not expose provider error bodies", async () => {
  await assert.rejects(
    requestOpenRouterEmbeddings(["one"], {
      apiKey: "test-key",
      signal: undefined,
      fetchImpl: async () => ({
        ok: false,
        status: 429,
        json: async () => ({ error: "secret provider detail" }),
      }),
    }),
    (error) => {
      assert.match(error.message, /HTTP 429/);
      assert.doesNotMatch(error.message, /secret provider detail|test-key/);
      return true;
    },
  );
});

test("buildStoredEmbeddingRows emits the store RPC contract", () => {
  assert.deepEqual(
    buildStoredEmbeddingRows(
      [
        {
          productId: "product-1",
          sourceDocument: "Product one",
          model: OPENROUTER_EMBEDDING_MODEL,
        },
      ],
      [vector(3)],
    ),
    [
      {
        product_id: "product-1",
        source_document: "Product one",
        model: OPENROUTER_EMBEDDING_MODEL,
        embedding: vector(3),
      },
    ],
  );
});

test("RPC operations match the embedding migration contract", async () => {
  const calls = [];
  const supabase = {
    rpc: async (name, parameters) => {
      calls.push({ name, parameters });
      return name === SOURCE_RPC ? { data: [source("product-1")] } : {};
    },
  };
  const operations = createEmbeddingRpcOperations(supabase);
  assert.deepEqual(await operations.getSources(12), [source("product-1")]);
  await operations.storeEmbeddings([
    {
      product_id: "product-1",
      embedding: vector(1),
      source_document: "Product one",
      model: OPENROUTER_EMBEDDING_MODEL,
    },
  ]);
  assert.deepEqual(calls, [
    { name: SOURCE_RPC, parameters: { p_limit: 12 } },
    {
      name: STORE_RPC,
      parameters: {
        p_product_id: "product-1",
        p_embedding: vector(1),
        p_source_document: "Product one",
        p_model: OPENROUTER_EMBEDDING_MODEL,
      },
    },
  ]);
});

test("syncProductEmbeddings processes batches until the source is empty", async () => {
  const sourceBatches = [
    [source("product-1"), source("product-2")],
    [source("product-3")],
    [],
  ];
  const requestedLimits = [];
  const embeddedInputs = [];
  const storedBatches = [];
  const progress = [];
  const result = await syncProductEmbeddings({
    batchSize: 2,
    getSources: async (limit) => {
      requestedLimits.push(limit);
      return sourceBatches.shift();
    },
    embedInputs: async (inputs) => {
      embeddedInputs.push(inputs);
      return inputs.map((_, index) => vector(index + 1));
    },
    storeEmbeddings: async (rows) => storedBatches.push(rows),
    onBatch: (value) => progress.push(value),
  });
  assert.deepEqual(result, { batches: 2, processed: 3 });
  assert.deepEqual(requestedLimits, [2, 2, 2]);
  assert.deepEqual(embeddedInputs, [
    ["input-product-1", "input-product-2"],
    ["input-product-3"],
  ]);
  assert.deepEqual(
    storedBatches.map((batch) => batch.map((row) => row.product_id)),
    [["product-1", "product-2"], ["product-3"]],
  );
  assert.deepEqual(progress, [
    { batch: 1, batchSize: 2, processed: 2 },
    { batch: 2, batchSize: 1, processed: 3 },
  ]);
});

test("syncProductEmbeddings stops an unchanged repeated batch", async () => {
  const repeated = [source("product-1")];
  await assert.rejects(
    syncProductEmbeddings({
      batchSize: 1,
      getSources: async () => repeated,
      embedInputs: async () => [vector(1)],
      storeEmbeddings: async () => {},
    }),
    /repeated an unchanged batch/,
  );
});
