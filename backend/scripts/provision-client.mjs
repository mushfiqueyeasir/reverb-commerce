import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  parseJsonOutput,
  repositoryRoot,
  runVercel,
  validateClient,
} from "./client-registry.mjs";

const args = parseArguments();
if (typeof args.client !== "string") {
  throw new Error("Usage: npm run client:provision -- --client <id> [--adopt <project>] [--no-deploy]");
}

const { manifest, manifestPath } = loadClient(args.client);
const validationErrors = validateClient(manifest);
if (validationErrors.length) {
  throw new Error(`Invalid ${manifestPath}:\n- ${validationErrors.join("\n- ")}`);
}

const secretPath = join(repositoryRoot, ".client-secrets", `${manifest.id}.env`);
const secrets = parseEnvFile(secretPath);
for (const key of ["SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!secrets[key]) throw new Error(`${key} is required in ${secretPath}`);
}
const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim() || secrets.OPENROUTER_API_KEY?.trim();
if (!openRouterApiKey) throw new Error(`OPENROUTER_API_KEY is required in the environment or ${secretPath}`);

runVercel(["whoami"], { capture: true });

const desiredProject = manifest.vercel.projectName;
const existingProject = typeof args.adopt === "string" ? args.adopt : desiredProject;
const projectList = parseJsonOutput(
  runVercel(["project", "list", "--filter", existingProject, "--json", "--limit", "100"], { capture: true }),
);
const projects = Array.isArray(projectList) ? projectList : projectList.projects ?? [];
const exactProject = projects.find((project) => project.name === existingProject);

if (!exactProject) {
  if (args.adopt) throw new Error(`Cannot adopt missing Vercel project: ${existingProject}`);
  runVercel(["project", "add", desiredProject]);
} else if (existingProject !== desiredProject) {
  runVercel(["project", "rename", existingProject, desiredProject]);
}

runVercel([
  "project",
  "update",
  desiredProject,
  "--framework",
  "nextjs",
  "--root-directory",
  manifest.vercel.rootDirectory,
]);

runVercel(["link", "--yes", "--project", desiredProject], { cwd: repositoryRoot });
if (!args.adopt) {
  runVercel(["git", "connect", "https://github.com/mushfiqueyeasir/reverb-commerce"], {
    cwd: repositoryRoot,
  });
}

const environment = {
  SUPABASE_URL: manifest.supabase.url,
  SUPABASE_ANON_KEY: secrets.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: secrets.SUPABASE_SERVICE_ROLE_KEY,
  OPENROUTER_API_KEY: openRouterApiKey,
  SITE_URL: manifest.domains.production,
  SECURITY_ENABLED: "true",
};

for (const [name, value] of Object.entries(environment)) {
  const visibility = name.endsWith("_KEY") ? "--sensitive" : "--no-sensitive";
  runVercel(
    ["env", "add", name, "production", "--force", visibility, "--project", desiredProject, "--yes"],
    { input: `${value}\n` },
  );
}

let deploymentUrl = null;
if (!args["no-deploy"]) {
  const output = runVercel(["--prod", "--yes"], { cwd: repositoryRoot, capture: true });
  deploymentUrl = output.match(/https:\/\/[^\s]+\.vercel\.app/g)?.at(-1) ?? null;
  if (output) console.log(output);
}

const refreshed = parseJsonOutput(
  runVercel(["project", "list", "--filter", desiredProject, "--json", "--limit", "100"], { capture: true }),
);
const refreshedProjects = Array.isArray(refreshed) ? refreshed : refreshed.projects ?? [];
const project = refreshedProjects.find((item) => item.name === desiredProject);
if (!project) throw new Error(`Unable to read Vercel project after provisioning: ${desiredProject}`);

writeFileSync(
  join(repositoryRoot, "backend", "clients", manifest.id, "deployment.json"),
  `${JSON.stringify({
    vercelProjectId: project.id,
    vercelProjectName: desiredProject,
    productionDomain: manifest.domains.production,
    lastProvisionedDeploymentUrl: deploymentUrl,
    supabaseProjectRef: manifest.supabase.projectRef,
    supabaseUrl: manifest.supabase.url,
    trackedAt: new Date().toISOString(),
  }, null, 2)}\n`,
);

console.log(`Provisioned ${manifest.id} as ${desiredProject}.`);
