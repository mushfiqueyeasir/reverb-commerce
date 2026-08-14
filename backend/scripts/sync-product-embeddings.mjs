import { createClient } from "@supabase/supabase-js";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
  validateClient,
} from "./client-registry.mjs";
import {
  parseBatchSize,
  requestOpenRouterEmbeddings,
  syncProductEmbeddings,
} from "./product-embeddings-core.mjs";

export const SOURCE_RPC = "get_product_embedding_sources";
export const STORE_RPC = "store_product_embedding";

function rpcError(operation, error) {
  const code =
    typeof error?.code === "string" && /^[A-Z0-9_]+$/i.test(error.code)
      ? ` (${error.code})`
      : "";
  return new Error(`Supabase ${operation} RPC failed${code}`);
}

export function createEmbeddingRpcOperations(supabase) {
  return {
    getSources: async (limit) => {
      const { data, error } = await supabase.rpc(SOURCE_RPC, {
        p_limit: limit,
      });
      if (error) throw rpcError("source", error);
      return data;
    },
    storeEmbeddings: async (rows) => {
      for (const row of rows) {
        const { error } = await supabase.rpc(STORE_RPC, {
          p_product_id: row.product_id,
          p_embedding: row.embedding,
          p_source_document: row.source_document,
          p_model: row.model,
        });
        if (error) throw rpcError("store", error);
      }
    },
  };
}

export async function runEmbeddingSync({
  argv = process.argv.slice(2),
  environment = process.env,
  createSupabaseClient = createClient,
  fetchImpl = globalThis.fetch,
  log = (message) => process.stdout.write(`${message}\n`),
} = {}) {
  const args = parseArguments(argv);
  if (typeof args.client !== "string" || !args.client.trim()) {
    throw new Error(
      "Usage: npm run embeddings:sync -- --client <id> [--batch-size <number>]",
    );
  }
  const apiKey = environment.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");
  const batchSize = parseBatchSize(args["batch-size"]);
  const { manifest, manifestPath } = loadClient(args.client.trim());
  const validationErrors = validateClient(manifest);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid ${manifestPath}: ${validationErrors.join(", ")}`);
  }
  const secretPath = join(
    repositoryRoot,
    ".client-secrets",
    `${manifest.id}.env`,
  );
  const serviceRoleKey = String(
    parseEnvFile(secretPath).SUPABASE_SERVICE_ROLE_KEY ?? "",
  ).trim();
  if (!serviceRoleKey) {
    throw new Error(`SUPABASE_SERVICE_ROLE_KEY is required in ${secretPath}`);
  }
  const supabase = createSupabaseClient(manifest.supabase.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const operations = createEmbeddingRpcOperations(supabase);
  const result = await syncProductEmbeddings({
    batchSize,
    getSources: operations.getSources,
    embedInputs: (inputs) =>
      requestOpenRouterEmbeddings(inputs, { apiKey, fetchImpl }),
    storeEmbeddings: operations.storeEmbeddings,
    onBatch: ({ batch, batchSize: completed, processed }) => {
      log(
        JSON.stringify({
          clientId: manifest.id,
          batch,
          batchSize: completed,
          processed,
        }),
      );
    },
  });
  log(JSON.stringify({ clientId: manifest.id, ...result, complete: true }));
  return result;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runEmbeddingSync().catch((error) => {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Product embedding sync failed";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
