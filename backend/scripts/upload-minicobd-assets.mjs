import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  loadClient,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import {
  maskSecret,
  createSupabaseFetch,
  requestJson,
} from "./provisioning-core.mjs";

const SUPABASE_API = "https://api.supabase.com";
export const MINICO_PROJECT_REF = "mvbzrkamyehnrfssanye";
export const MINICO_BRAND_PRIMARY = "#660c23";
export const ASSET_VERSION = "v1";
export const ASSET_PREFIX = `minicobd/${ASSET_VERSION}`;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const ASSETS = [
  {
    bucket: "banner-images",
    path: `${ASSET_PREFIX}/hero-desktop.jpg`,
    source:
      "https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Four colorful smartphone cases arranged on a dark surface",
  },
  {
    bucket: "banner-images",
    path: `${ASSET_PREFIX}/hero-mobile.jpg`,
    source:
      "https://images.pexels.com/photos/18403793/pexels-photo-18403793.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Elegant smartphone cases showcased outdoors",
  },
  {
    bucket: "banner-images",
    path: `${ASSET_PREFIX}/og-image.jpg`,
    source:
      "https://images.pexels.com/photos/3184451/pexels-photo-3184451.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Flatlay of everyday gadgets and mobile accessories",
  },
  {
    bucket: "branding",
    path: `${ASSET_PREFIX}/og-image.jpg`,
    source:
      "https://images.pexels.com/photos/3184451/pexels-photo-3184451.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Flatlay of everyday gadgets and mobile accessories",
  },
  {
    bucket: "category-images",
    path: `${ASSET_PREFIX}/mobile-covers.jpg`,
    source:
      "https://images.pexels.com/photos/18221360/pexels-photo-18221360.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Elegant leather phone cases in an urban setting",
  },
  {
    bucket: "category-images",
    path: `${ASSET_PREFIX}/accessories.jpg`,
    source:
      "https://images.pexels.com/photos/16389484/pexels-photo-16389484.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Close-up of a smartphone camera lens against a warm background",
  },
  {
    bucket: "category-images",
    path: `${ASSET_PREFIX}/lifestyle.jpg`,
    source:
      "https://images.pexels.com/photos/17343193/pexels-photo-17343193.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Black phone case resting on a rustic wooden table",
  },
];

function validateSource(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid asset source URL: ${value}`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`Invalid asset source URL: ${value}`);
  }
  return url.toString();
}

async function downloadImage(sourceValue) {
  const sourceUrl = validateSource(sourceValue);
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "ReverbCommerceMiniCoAssets/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`Image request failed: ${sourceUrl}`);
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (!contentType.startsWith("image/")) {
    throw new Error(`Asset source did not return an image: ${sourceUrl}`);
  }
  if (declaredLength > MAX_IMAGE_BYTES) {
    throw new Error(`Asset source exceeds 10 MB: ${sourceUrl}`);
  }
  const content = Buffer.from(await response.arrayBuffer());
  if (content.length > MAX_IMAGE_BYTES) {
    throw new Error(`Asset source exceeds 10 MB: ${sourceUrl}`);
  }
  return { content, contentType: contentType || "image/jpeg" };
}

async function storageClient(managementRequest, projectRef) {
  const keyResponse = await managementRequest(
    `/v1/projects/${projectRef}/api-keys`,
  );
  const keys = Array.isArray(keyResponse)
    ? keyResponse
    : (keyResponse?.keys ?? []);
  const serviceRole = keys.find(
    (key) => key.type === "legacy" && key.name === "service_role",
  )?.api_key;
  if (!serviceRole) throw new Error("MiniCo service-role key is unavailable");
  maskSecret(serviceRole);
  return createClient(`https://${projectRef}.supabase.co`, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createSupabaseFetch(serviceRole) },
  });
}

export async function uploadMiniCoAssets({ apply = false } = {}) {
  const envPath = resolve(repositoryRoot, ".client-secrets", "minicobd.env");
  const secrets = parseEnvFile(envPath);
  const { manifest } = loadClient("minicobd");
  const accessToken = secrets.SUPABASE_ACCESS_TOKEN?.trim();
  if (!accessToken) throw new Error("SUPABASE_ACCESS_TOKEN is unavailable");
  maskSecret(accessToken);
  const managementRequest = (path) =>
    requestJson(`${SUPABASE_API}${path}`, {
      token: accessToken,
      expected: [200],
    });
  const supabase = await storageClient(
    managementRequest,
    manifest.supabase?.projectRef ?? MINICO_PROJECT_REF,
  );

  const existing = [];
  for (const asset of ASSETS) {
    const { error } = await supabase.storage
      .from(asset.bucket)
      .info(asset.path);
    if (!error) existing.push(asset);
  }
  if (existing.length) {
    const names = existing
      .map((asset) => `${asset.bucket}/${asset.path}`)
      .join(", ");
    if (!apply) {
      console.log(`Already present: ${names}`);
      return { uploaded: [], present: existing };
    }
  }

  if (!apply && existing.length !== ASSETS.length) {
    throw new Error(
      `Missing MiniCo assets; rerun with --apply to upload (present: ${existing.length}/${ASSETS.length})`,
    );
  }
  if (!apply) return { uploaded: [], present: existing };

  const uploaded = [];
  for (const asset of ASSETS) {
    const { content, contentType } = await downloadImage(asset.source);
    const { error } = await supabase.storage
      .from(asset.bucket)
      .upload(asset.path, content, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });
    if (error)
      throw new Error(
        `Upload failed ${asset.bucket}/${asset.path}: ${error.message}`,
      );
    uploaded.push(asset);
    console.log(
      `Uploaded ${asset.bucket}/${asset.path} (${content.length} bytes)`,
    );
  }
  return { uploaded, present: existing };
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  uploadMiniCoAssets({ apply })
    .then(({ uploaded, present }) => {
      console.log(
        `MiniCo assets: uploaded ${uploaded.length}, present ${present.length}, total ${ASSETS.length}`,
      );
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
