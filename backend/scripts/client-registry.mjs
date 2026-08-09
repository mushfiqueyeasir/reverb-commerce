import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));

export const repositoryRoot = resolve(scriptDirectory, "../..");
export const clientsDirectory = join(repositoryRoot, "backend", "clients");
export const websiteDirectory = join(repositoryRoot, "frontend", "website");
export const vercelPackage = "vercel@58.7.1";

export function parseArguments(argv = process.argv.slice(2)) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

export function loadClient(clientId) {
  const manifestPath = join(clientsDirectory, clientId, "tenant.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Client manifest not found: ${manifestPath}`);
  }
  return {
    manifest: JSON.parse(readFileSync(manifestPath, "utf8")),
    manifestPath,
  };
}

export function loadAllClients() {
  return readdirSync(clientsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => loadClient(entry.name));
}

export function validateClient(manifest) {
  const errors = [];
  const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const httpsUrl = (value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash &&
        !url.username &&
        !url.password &&
        !url.port
      );
    } catch {
      return false;
    }
  };

  if (!idPattern.test(manifest.id ?? "")) errors.push("id must be kebab-case");
  if (!String(manifest.displayName ?? "").trim())
    errors.push("displayName is required");
  if (
    !["onboarding", "active", "suspended", "archived"].includes(manifest.status)
  ) {
    errors.push("status is invalid");
  }
  if (!httpsUrl(manifest.domains?.production))
    errors.push("production domain must be HTTPS");
  else if (
    manifest.domains.production !==
    `https://${new URL(manifest.domains.production).hostname.toLowerCase()}`
  ) {
    errors.push("production domain must use canonical lowercase origin form");
  }
  for (const alias of manifest.domains?.aliases ?? []) {
    if (!httpsUrl(alias)) errors.push(`domain alias must be HTTPS: ${alias}`);
    else if (alias !== `https://${new URL(alias).hostname.toLowerCase()}`) {
      errors.push(
        `domain alias must use canonical lowercase origin form: ${alias}`,
      );
    }
  }
  const aliases = manifest.domains?.aliases ?? [];
  if (new Set(aliases).size !== aliases.length)
    errors.push("domain aliases must be unique");
  if (aliases.includes(manifest.domains?.production)) {
    errors.push("production domain cannot also be an alias");
  }
  if (manifest.vercel?.projectName !== `store-${manifest.id}`) {
    errors.push(`Vercel project must be named store-${manifest.id}`);
  }
  if (manifest.vercel?.rootDirectory !== "frontend/website") {
    errors.push("Vercel rootDirectory must be frontend/website");
  }
  if (manifest.vercel?.productionBranch !== "main") {
    errors.push("Vercel productionBranch must be main");
  }
  if (!/^[a-z0-9]+$/.test(manifest.supabase?.projectRef ?? "")) {
    errors.push("Supabase projectRef is invalid");
  }
  if (!httpsUrl(manifest.supabase?.url))
    errors.push("Supabase URL must be HTTPS");
  if (
    manifest.supabase?.projectRef &&
    manifest.supabase?.url !==
      `https://${manifest.supabase.projectRef}.supabase.co`
  ) {
    errors.push("Supabase URL must match projectRef");
  }
  if (!/^\d{4}$/.test(manifest.supabase?.schemaVersion ?? "")) {
    errors.push("Supabase schemaVersion must be four digits");
  }

  return errors;
}

export function parseEnvFile(path) {
  if (!existsSync(path)) throw new Error(`Secret file not found: ${path}`);
  const values = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) throw new Error(`Invalid line in ${path}`);
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

export function runVercel(args, options = {}) {
  const npmCli = process.env.npm_execpath;
  const npxCli = npmCli ? join(dirname(npmCli), "npx-cli.js") : null;
  const command = npxCli && existsSync(npxCli) ? process.execPath : "npx";
  const commandArgs =
    npxCli && existsSync(npxCli)
      ? [npxCli, "--yes", vercelPackage, ...args]
      : ["--yes", vercelPackage, ...args];
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd ?? repositoryRoot,
    input: options.input,
    encoding: "utf8",
    stdio: options.capture
      ? ["pipe", "pipe", "pipe"]
      : ["pipe", "inherit", "inherit"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (options.capture && result.stderr) process.stderr.write(result.stderr);
    throw new Error(`Vercel command failed: ${args.join(" ")}`);
  }
  return options.capture ? result.stdout.trim() : "";
}

export function parseJsonOutput(output) {
  const objectAt = output.search(/[\[{]/);
  if (objectAt === -1) throw new Error("Vercel did not return JSON");
  return JSON.parse(output.slice(objectAt));
}
