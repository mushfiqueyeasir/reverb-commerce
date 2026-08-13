/**
 * Delete Supabase Storage objects that are no longer referenced in the DB.
 *
 * Usage:
 *   node scripts/cleanup-unused-assets.mjs
 *   node scripts/cleanup-unused-assets.mjs --dry-run
 *   node scripts/cleanup-unused-assets.mjs --client ve-gear --dry-run
 *
 * Required environment variables:
 *   Registered client: SUPABASE_ACCESS_TOKEN
 *   Direct environment: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
  validateClient,
} from "./client-registry.mjs";
import {
  createSupabaseFetch,
  maskSecret,
  requestJson,
} from "./provisioning-core.mjs";

const BUCKETS = [
  "product-images",
  "category-images",
  "review-images",
  "promotion-images",
  "branding",
  "banner-images",
];

/** Skip deleting files newer than this (avoids races with in-flight uploads). */
const MIN_AGE_MS = 24 * 60 * 60 * 1000;

/** Seed / code-default assets — keep even if not currently referenced in DB. */
const PROTECTED_PREFIXES = ["lovable/", "store-template/"];

const DELETE_BATCH = 100;
const LIST_PAGE = 1000;
const SELECT_PAGE = 1000;

const args = parseArguments();
const dryRun = args["dry-run"] === true;

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Service-role key is not a JWT");
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("Service-role key has an invalid JWT payload");
  }
}

function validateServiceRoleKey(key, projectRef) {
  if (key.startsWith("sb_secret_")) return;
  const payload = decodeJwtPayload(key);
  if (payload.role !== "service_role") {
    throw new Error(
      `Expected service_role JWT, received ${payload.role || "unknown"}`,
    );
  }
  if (projectRef && payload.ref !== projectRef) {
    throw new Error(
      `Service-role JWT project ${payload.ref || "unknown"} does not match ${projectRef}`,
    );
  }
}

function projectRefFromUrl(url) {
  try {
    const match = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

async function loadManagedServiceRoleKey(projectRef) {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!accessToken) return "";
  const baseUrl = `https://api.supabase.com/v1/projects/${projectRef}/api-keys`;
  const response = await requestJson(baseUrl, { token: accessToken });
  const keys = Array.isArray(response) ? response : (response?.keys ?? []);
  const entry =
    keys.find((key) => key.type === "secret" && key.name === "default") ??
    keys.find((key) => key.type === "secret") ??
    keys.find((key) => key.type === "legacy" && key.name === "service_role");
  if (!entry) throw new Error(`Supabase has no server key for ${projectRef}`);
  let key = String(entry.api_key ?? "").trim();
  if (!key || key.includes("...")) {
    if (!entry.id)
      throw new Error(
        `Supabase server key cannot be revealed for ${projectRef}`,
      );
    const revealed = await requestJson(
      `${baseUrl}/${encodeURIComponent(entry.id)}?reveal=true`,
      { token: accessToken },
    );
    key = String(revealed?.api_key ?? "").trim();
  }
  if (!key)
    throw new Error(`Supabase returned an empty server key for ${projectRef}`);
  maskSecret(key);
  return key;
}

async function loadClientServiceRoleKey(clientId, projectRef) {
  const managedKey = await loadManagedServiceRoleKey(projectRef);
  if (managedKey) return managedKey;

  const credentialsJson = process.env.CLIENT_SUPABASE_CREDENTIALS?.trim();
  if (credentialsJson) {
    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch {
      throw new Error("CLIENT_SUPABASE_CREDENTIALS is not valid JSON");
    }
    const key = String(credentials?.[clientId]?.serviceRoleKey ?? "").trim();
    if (!key) {
      throw new Error(
        `CLIENT_SUPABASE_CREDENTIALS has no serviceRoleKey for ${clientId}`,
      );
    }
    return key;
  }

  const localPath = join(repositoryRoot, ".client-secrets", `${clientId}.env`);
  if (existsSync(localPath)) {
    return String(
      parseEnvFile(localPath).SUPABASE_SERVICE_ROLE_KEY ?? "",
    ).trim();
  }
  throw new Error(`No cleanup credentials found for ${clientId}`);
}

async function loadConfig() {
  if (typeof args.client === "string") {
    const { manifest, manifestPath } = loadClient(args.client);
    const validationErrors = validateClient(manifest);
    if (validationErrors.length) {
      throw new Error(
        `Invalid ${manifestPath}:\n- ${validationErrors.join("\n- ")}`,
      );
    }
    if (manifest.status !== "active") {
      throw new Error(
        `Cleanup is disabled for ${manifest.id} (${manifest.status})`,
      );
    }

    const deploymentPath = join(dirname(manifestPath), "deployment.json");
    const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
    const url = String(deployment.supabaseUrl ?? "").trim();
    const serviceRoleKey = await loadClientServiceRoleKey(
      manifest.id,
      manifest.supabase.projectRef,
    );

    if (url !== manifest.supabase.url) {
      throw new Error(
        `${deploymentPath}: Supabase URL does not match tenant.json`,
      );
    }
    if (deployment.supabaseProjectRef !== manifest.supabase.projectRef) {
      throw new Error(
        `${deploymentPath}: Supabase project reference does not match tenant.json`,
      );
    }
    validateServiceRoleKey(serviceRoleKey, manifest.supabase.projectRef);

    return {
      clientId: manifest.id,
      projectRef: manifest.supabase.projectRef,
      url,
      serviceRoleKey,
    };
  }

  return {
    clientId: null,
    projectRef: process.env.SUPABASE_PROJECT_REF?.trim() || "",
    url: process.env.SUPABASE_URL?.trim() || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "",
  };
}

function normalizePath(raw, bucket) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = value.indexOf(marker);
    if (idx === -1) return null;
    try {
      return decodeURIComponent(value.slice(idx + marker.length).split("?")[0]);
    } catch {
      return value.slice(idx + marker.length).split("?")[0];
    }
  }

  return value.replace(/^\/+/, "");
}

function addPath(set, bucket, raw) {
  const path = normalizePath(raw, bucket);
  if (path) set.add(path);
}

function collectFromCms(cms, referenced) {
  if (!cms || typeof cms !== "object") return;

  for (const banner of cms.banners ?? []) {
    addPath(
      referenced.get("banner-images"),
      "banner-images",
      banner?.image_path,
    );
    addPath(
      referenced.get("banner-images"),
      "banner-images",
      banner?.mobile_image_path,
    );
  }

  for (const section of cms.about_sections ?? []) {
    const cfg = section?.config ?? {};
    const path = cfg.image_path;
    const bucketKey =
      cfg.image_bucket === "branding" ? "branding" : "banner-images";
    addPath(referenced.get(bucketKey), bucketKey, path);
  }

  for (const section of cms.homepage_sections ?? []) {
    const cfg = section?.config ?? {};
    if (cfg.image_path) {
      const bucketKey =
        cfg.image_bucket === "branding"
          ? "branding"
          : cfg.image_bucket === "product"
            ? "product-images"
            : "banner-images";
      addPath(referenced.get(bucketKey), bucketKey, cfg.image_path);
    }
  }

  addPath(referenced.get("branding"), "branding", cms.favicon_path);
  addPath(referenced.get("branding"), "branding", cms.seo?.og_image_path);

  for (const page of Object.values(cms.pages_seo ?? {})) {
    addPath(referenced.get("branding"), "branding", page?.og_image_path);
  }

  // Sweep HTML blobs for any public storage URLs.
  const htmlChunks = [];
  for (const page of Object.values(cms.pages ?? {})) {
    if (page?.body_html) htmlChunks.push(page.body_html);
  }
  for (const section of cms.about_sections ?? []) {
    if (section?.config?.body_html) htmlChunks.push(section.config.body_html);
    if (section?.body) htmlChunks.push(String(section.body));
  }
  for (const section of cms.homepage_sections ?? []) {
    if (section?.body) htmlChunks.push(String(section.body));
  }

  const urlRe =
    /\/storage\/v1\/object\/public\/(product-images|category-images|review-images|promotion-images|branding|banner-images)\/([^"'?\s]+)/g;
  for (const html of htmlChunks) {
    let match;
    while ((match = urlRe.exec(html)) !== null) {
      addPath(referenced.get(match[1]), match[1], decodeURIComponent(match[2]));
    }
  }
}

function isMissingTableError(error) {
  return (
    error?.code === "PGRST205" ||
    /could not find the table .* in the schema cache/i.test(
      error?.message ?? "",
    )
  );
}

async function selectAllRows(
  supabase,
  table,
  columns,
  { optional = false } = {},
) {
  const rows = [];
  let total = null;

  while (total == null || rows.length < total) {
    const { data, error, count } = await supabase
      .from(table)
      .select(columns, { count: "exact" })
      .range(rows.length, rows.length + SELECT_PAGE - 1);

    if (error) {
      if (optional && isMissingTableError(error)) {
        console.warn(`[warn] optional table ${table} is not installed`);
        return [];
      }
      throw new Error(`[${table}] reference query failed: ${error.message}`);
    }
    if (total == null) {
      if (count == null)
        throw new Error(`[${table}] reference count is unavailable`);
      total = count;
    }

    const page = data ?? [];
    rows.push(...page);
    if (rows.length < total && page.length === 0) {
      throw new Error(
        `[${table}] reference pagination stopped at ${rows.length} of ${total}`,
      );
    }
  }

  return rows;
}

async function collectReferencedPaths(supabase) {
  const referenced = new Map(BUCKETS.map((b) => [b, new Set()]));

  const [
    productImages,
    categories,
    reviews,
    promotions,
    banners,
    siteSettings,
    homepageSections,
    products,
  ] = await Promise.all([
    selectAllRows(supabase, "product_images", "path"),
    selectAllRows(supabase, "categories", "image_path"),
    selectAllRows(supabase, "reviews", "image_path"),
    selectAllRows(supabase, "promotions", "image_path"),
    selectAllRows(supabase, "banners", "image_path, mobile_image_path", {
      optional: true,
    }),
    supabase
      .from("site_settings")
      .select("logo_path, invoice_logo_path, favicon_path, socials")
      .limit(1)
      .maybeSingle(),
    selectAllRows(supabase, "homepage_sections", "config, body", {
      optional: true,
    }),
    selectAllRows(supabase, "products", "description"),
  ]);

  if (siteSettings.error) {
    throw new Error(
      `[site_settings] reference query failed: ${siteSettings.error.message}`,
    );
  }

  for (const row of productImages) {
    addPath(referenced.get("product-images"), "product-images", row.path);
  }
  for (const row of categories) {
    addPath(
      referenced.get("category-images"),
      "category-images",
      row.image_path,
    );
  }
  for (const row of reviews) {
    addPath(referenced.get("review-images"), "review-images", row.image_path);
  }
  for (const row of promotions) {
    addPath(
      referenced.get("promotion-images"),
      "promotion-images",
      row.image_path,
    );
  }
  for (const row of banners) {
    addPath(referenced.get("banner-images"), "banner-images", row.image_path);
    addPath(
      referenced.get("banner-images"),
      "banner-images",
      row.mobile_image_path,
    );
  }

  if (siteSettings.data) {
    addPath(
      referenced.get("branding"),
      "branding",
      siteSettings.data.logo_path,
    );
    addPath(
      referenced.get("branding"),
      "branding",
      siteSettings.data.invoice_logo_path,
    );
    addPath(
      referenced.get("branding"),
      "branding",
      siteSettings.data.favicon_path,
    );
    const socials = siteSettings.data.socials ?? {};
    collectFromCms(socials._cms, referenced);
  }

  for (const row of homepageSections) {
    const cfg = row.config ?? {};
    if (cfg.image_path) {
      const bucketKey =
        cfg.image_bucket === "branding" ? "branding" : "banner-images";
      addPath(referenced.get(bucketKey), bucketKey, cfg.image_path);
    }
  }

  const descRe =
    /\/storage\/v1\/object\/public\/(product-images|category-images|review-images|promotion-images|branding|banner-images)\/([^"'?\s]+)/g;
  for (const row of products) {
    if (!row.description) continue;
    let match;
    while ((match = descRe.exec(row.description)) !== null) {
      addPath(referenced.get(match[1]), match[1], decodeURIComponent(match[2]));
    }
  }

  return referenced;
}

async function listAllObjects(supabase, bucket) {
  const files = [];

  async function walk(prefix) {
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: LIST_PAGE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error)
        throw new Error(`[${bucket}] list ${prefix || "/"}: ${error.message}`);
      if (!data?.length) break;

      for (const item of data) {
        const path = prefix ? `${prefix}/${item.name}` : item.name;
        // Folders have id === null in Storage list responses.
        const isFolder = item.id == null && !item.metadata;
        if (isFolder) {
          await walk(path);
        } else {
          files.push({
            path,
            updatedAt: item.updated_at || item.created_at || null,
          });
        }
      }

      if (data.length < LIST_PAGE) break;
      offset += LIST_PAGE;
    }
  }

  await walk("");
  return files;
}

async function deletePaths(supabase, bucket, paths) {
  let deleted = 0;
  for (let i = 0; i < paths.length; i += DELETE_BATCH) {
    const chunk = paths.slice(i, i + DELETE_BATCH);
    if (dryRun) {
      deleted += chunk.length;
      continue;
    }
    const { error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) {
      throw new Error(`[${bucket}] delete failed: ${error.message}`);
    }
    deleted += chunk.length;
  }
  return deleted;
}

function isOldEnough(updatedAt) {
  if (!updatedAt) return true;
  const ts = Date.parse(updatedAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts >= MIN_AGE_MS;
}

async function main() {
  const config = await loadConfig();
  const url =
    config.url ||
    (config.projectRef ? `https://${config.projectRef}.supabase.co` : "");
  if (!url) throw new Error("SUPABASE_URL or SUPABASE_PROJECT_REF is required");

  if (!config.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }
  validateServiceRoleKey(
    config.serviceRoleKey,
    config.projectRef || projectRefFromUrl(url),
  );

  const supabase = createClient(url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createSupabaseFetch(config.serviceRoleKey) },
  });

  console.log(
    `Cleanup start${dryRun ? " (dry-run)" : ""} · client ${config.clientId || "environment"} · project ${config.projectRef || url}`,
  );

  const referenced = await collectReferencedPaths(supabase);
  let totalOrphans = 0;
  let totalDeleted = 0;
  let totalSkippedFresh = 0;

  for (const bucket of BUCKETS) {
    const used = referenced.get(bucket) ?? new Set();
    const objects = await listAllObjects(supabase, bucket);

    const orphans = [];
    for (const obj of objects) {
      if (used.has(obj.path)) continue;
      if (PROTECTED_PREFIXES.some((p) => obj.path.startsWith(p))) continue;
      if (!isOldEnough(obj.updatedAt)) {
        totalSkippedFresh += 1;
        continue;
      }
      orphans.push(obj.path);
    }

    console.log(
      `[${bucket}] listed=${objects.length} referenced=${used.size} orphans=${orphans.length}`,
    );

    if (orphans.length === 0) continue;

    for (const path of orphans.slice(0, 20)) {
      console.log(`  - ${dryRun ? "would delete" : "delete"} ${path}`);
    }
    if (orphans.length > 20) {
      console.log(`  … and ${orphans.length - 20} more`);
    }

    totalOrphans += orphans.length;
    totalDeleted += await deletePaths(supabase, bucket, orphans);
  }

  console.log(
    `Done. orphans=${totalOrphans} ${dryRun ? "wouldDelete" : "deleted"}=${totalDeleted} skippedFresh=${totalSkippedFresh}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
