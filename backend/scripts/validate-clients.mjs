import { loadAllClients, validateClient } from "./client-registry.mjs";
import { basename, dirname } from "node:path";
import { existsSync, readFileSync } from "node:fs";

let invalid = false;
const seen = {
  domain: new Map(),
  project: new Map(),
  supabase: new Map(),
};
for (const { manifest, manifestPath } of loadAllClients()) {
  const errors = validateClient(manifest);
  if (basename(dirname(manifestPath)) !== manifest.id) {
    errors.push("client directory name must match manifest id");
  }
  const backupPath = `${dirname(manifestPath)}/environment.backup.json`;
  if (existsSync(backupPath)) {
    const backup = JSON.parse(readFileSync(backupPath, "utf8"));
    const sensitiveName =
      /(?:ACCESS_TOKEN|SERVICE_ROLE_KEY|PASSWORD|PASS|PRIVATE_KEY|SECRET|TOKEN|API_KEY|CREDENTIALS?)$/i;
    for (const source of Object.values(backup.sources ?? {})) {
      for (const [name, value] of Object.entries(source ?? {})) {
        if (sensitiveName.test(name) && String(value ?? "").trim()) {
          errors.push(`environment.backup.json must leave ${name} blank`);
        }
      }
    }
  }
  const uniqueValues = [
    ["project", manifest.vercel?.projectName],
    ["supabase", manifest.supabase?.projectRef],
    ...[manifest.domains?.production, ...(manifest.domains?.aliases ?? [])].map(
      (domain) => ["domain", domain],
    ),
  ];
  for (const [kind, value] of uniqueValues) {
    if (!value) continue;
    const owner = seen[kind].get(value);
    if (owner)
      errors.push(`${kind} is already registered to ${owner}: ${value}`);
    else seen[kind].set(value, manifest.id);
  }
  if (errors.length) {
    invalid = true;
    console.error(`${manifestPath}:`);
    for (const error of errors) console.error(`  - ${error}`);
  } else {
    console.log(`valid: ${manifest.id}`);
  }
}

if (invalid) process.exitCode = 1;
