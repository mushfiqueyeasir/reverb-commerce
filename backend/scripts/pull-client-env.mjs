import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parseEnv } from "node:util";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
  runVercel,
  validateClient,
  websiteDirectory,
} from "./client-registry.mjs";
import { maskSecret, requestJson } from "./provisioning-core.mjs";

const args = parseArguments();
if (typeof args.client !== "string") {
  throw new Error("Usage: npm run client:env:pull -- --client <id>");
}

const { manifest, manifestPath } = loadClient(args.client);
const errors = validateClient(manifest);
if (errors.length) {
  throw new Error(`Invalid ${manifestPath}:\n- ${errors.join("\n- ")}`);
}

runVercel(["whoami"], { capture: true });

const outputPath = relative(
  repositoryRoot,
  join(websiteDirectory, `.env.${manifest.id}`),
).replaceAll("\\", "/");

runVercel([
  "env",
  "pull",
  outputPath,
  "--environment",
  "production",
  "--project",
  manifest.vercel.projectName,
  "--yes",
]);

const absoluteOutputPath = join(websiteDirectory, `.env.${manifest.id}`);
const pulled = parseEnv(readFileSync(absoluteOutputPath, "utf8"));
const localSecretPath = join(
  repositoryRoot,
  ".client-secrets",
  `${manifest.id}.env`,
);
let supabaseKeys = null;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (accessToken) {
  const baseUrl = `https://api.supabase.com/v1/projects/${manifest.supabase.projectRef}/api-keys`;
  const response = await requestJson(baseUrl, { token: accessToken });
  const keys = Array.isArray(response) ? response : (response?.keys ?? []);
  const publishable =
    keys.find((key) => key.type === "legacy" && key.name === "anon") ??
    keys.find((key) => key.type === "publishable" && key.name === "default") ??
    keys.find((key) => key.type === "publishable");
  const secret =
    keys.find((key) => key.type === "legacy" && key.name === "service_role") ??
    keys.find((key) => key.type === "secret" && key.name === "default") ??
    keys.find((key) => key.type === "secret");
  if (!publishable || !secret)
    throw new Error("Supabase project API keys are incomplete");
  const reveal = async (entry) => {
    const current = String(entry.api_key ?? "").trim();
    if (current && !current.includes("...")) return current;
    if (!entry.id)
      throw new Error(
        `Supabase API key ${entry.name ?? entry.type} cannot be revealed`,
      );
    const revealed = await requestJson(
      `${baseUrl}/${encodeURIComponent(entry.id)}?reveal=true`,
      { token: accessToken },
    );
    return String(revealed?.api_key ?? "").trim();
  };
  supabaseKeys = {
    SUPABASE_ANON_KEY: await reveal(publishable),
    SUPABASE_SERVICE_ROLE_KEY: await reveal(secret),
  };
  maskSecret(supabaseKeys.SUPABASE_ANON_KEY);
  maskSecret(supabaseKeys.SUPABASE_SERVICE_ROLE_KEY);
} else {
  supabaseKeys = parseEnvFile(localSecretPath);
}
const environment = {
  SUPABASE_URL: pulled.SUPABASE_URL || manifest.supabase.url,
  SUPABASE_ANON_KEY: supabaseKeys.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: supabaseKeys.SUPABASE_SERVICE_ROLE_KEY,
  SITE_URL: pulled.SITE_URL || manifest.domains.production,
};
for (const [name, value] of Object.entries(environment)) {
  if (!value) throw new Error(`Missing required variable ${name}`);
}

const lines = Object.entries(environment).map(
  ([name, value]) => `${name}=${JSON.stringify(value)}`,
);
lines.push('SECURITY_ENABLED="true"');
writeFileSync(absoluteOutputPath, `${lines.join("\n")}\n`);

console.log(`Pulled ${manifest.id} environment to ${outputPath}.`);
