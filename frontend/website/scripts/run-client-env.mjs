import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseEnv } from "node:util";

const websiteDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [command, clientId, ...nextArguments] = process.argv.slice(2);

if (
  !["dev", "build"].includes(command) ||
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clientId ?? "")
) {
  throw new Error("Usage: npm run dev:client -- <client-id> (or build:client)");
}

const envPath = join(websiteDirectory, `.env.${clientId}`);
if (!existsSync(envPath)) {
  throw new Error(
    `Missing ${envPath}. Run npm run client:env:pull -- --client ${clientId} from backend first.`,
  );
}

const nextCli = join(
  websiteDirectory,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
if (!existsSync(nextCli))
  throw new Error("Run npm install in frontend/website first");

const result = spawnSync(
  process.execPath,
  [nextCli, command, ...nextArguments],
  {
    cwd: websiteDirectory,
    env: { ...process.env, ...parseEnv(readFileSync(envPath, "utf8")) },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
