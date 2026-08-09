import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parseEnv } from "node:util";
import {
  clientsDirectory,
  loadClient,
  repositoryRoot,
  websiteDirectory,
} from "./client-registry.mjs";

const clientIndex = process.argv.indexOf("--client");
const clientId = clientIndex >= 0 ? process.argv[clientIndex + 1] : "";
if (!clientId) {
  throw new Error("Usage: npm run client:env:backup -- --client <id>");
}

loadClient(clientId);

const sourcePaths = [
  join(websiteDirectory, ".env"),
  join(websiteDirectory, `.env.${clientId}`),
];
const sources = {};

for (const sourcePath of sourcePaths) {
  if (!existsSync(sourcePath)) {
    throw new Error(`Environment file not found: ${sourcePath}`);
  }
  const relativePath = relative(repositoryRoot, sourcePath).replaceAll("\\", "/");
  const parsed = parseEnv(readFileSync(sourcePath, "utf8"));
  sources[relativePath] = Object.fromEntries(
    Object.entries(parsed).sort(([left], [right]) => left.localeCompare(right)),
  );
}

const outputPath = join(clientsDirectory, clientId, "environment.backup.json");
const backup = {
  formatVersion: 1,
  purpose: "Backup only; application runtime continues to use environment variables.",
  clientId,
  sources,
};

writeFileSync(outputPath, `${JSON.stringify(backup, null, 2)}\n`);

const variableCount = Object.values(sources).reduce(
  (total, source) => total + Object.keys(source).length,
  0,
);
console.log(
  `Backed up ${variableCount} variables from ${sourcePaths.length} files to ${relative(
    repositoryRoot,
    outputPath,
  ).replaceAll("\\", "/")}`,
);
