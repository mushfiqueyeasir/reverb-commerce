import { createClient } from "@supabase/supabase-js";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import {
  buildPlaceholderAssets,
  deriveStoreDefaults,
  generateDatabasePassword,
  HttpError,
  maskSecret,
  normalizeHttpsUrl,
  renderSqlTemplate,
  requestJson,
  responseRows,
  sha256,
  sleep,
  sqlLiteral,
  validateClientId,
} from "./provisioning-core.mjs";
import {
  clientsDirectory,
  loadAllClients,
  repositoryRoot,
} from "./client-registry.mjs";

const SUPABASE_API = "https://api.supabase.com";
const VERCEL_API = "https://api.vercel.com";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function optional(name, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

function numericString(name, fallback) {
  const value = optional(name, fallback);
  if (!/^\d+(?:\.\d{1,2})?$/.test(value))
    throw new Error(`${name} must be a non-negative number`);
  return value;
}

function output(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    const line = `${name}=${String(value).replaceAll("\n", "%0A")}\n`;
    writeFileSync(outputPath, line, { flag: "a" });
  }
}

function summary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) writeFileSync(summaryPath, `${markdown}\n`, { flag: "a" });
}

function getConfig() {
  const siteUrl = normalizeHttpsUrl(required("SITE_URL"), "SITE_URL");
  const derived = deriveStoreDefaults(siteUrl, (clientId) =>
    existsSync(join(clientsDirectory, clientId)),
  );
  const clientId = validateClientId(optional("CLIENT_ID", derived.clientId));
  const mode = optional("PROVISION_MODE", "resume");
  if (!new Set(["provision", "resume"]).has(mode)) {
    throw new Error("PROVISION_MODE must be provision or resume");
  }
  const aliasInput = optional("ALIAS_URL");
  const aliasUrl = aliasInput
    ? normalizeHttpsUrl(aliasInput, "ALIAS_URL")
    : derived.aliasUrl;
  if (aliasUrl === siteUrl)
    throw new Error("ALIAS_URL must differ from SITE_URL");
  const releaseSha = required("RELEASE_SHA").toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(releaseSha))
    throw new Error("RELEASE_SHA must be a full Git commit SHA");
  const config = {
    clientId,
    mode,
    displayName: optional("STORE_NAME", derived.displayName),
    siteUrl,
    aliasUrl,
    contactEmail: optional("CONTACT_EMAIL", derived.contactEmail),
    contactPhone: optional("CONTACT_PHONE"),
    storeAddress: optional("STORE_ADDRESS"),
    currency: optional("CURRENCY", "BDT"),
    currencySymbol: optional("CURRENCY_SYMBOL", "৳"),
    shippingFlat: numericString("SHIPPING_FLAT", "80"),
    freeShippingThreshold: numericString("FREE_SHIPPING_THRESHOLD", "1000"),
    supabaseToken: required("SUPABASE_ACCESS_TOKEN"),
    supabaseOrganizationSlug: optional("SUPABASE_ORG_SLUG"),
    supabaseRegion: optional("SUPABASE_REGION", "ap-southeast-1"),
    supabaseInstanceSize: optional("SUPABASE_INSTANCE_SIZE"),
    vercelToken: required("VERCEL_TOKEN"),
    vercelTeamId: optional("VERCEL_TEAM_ID"),
    gitRepository: optional(
      "VERCEL_GIT_REPOSITORY",
      "mushfiqueyeasir/reverb-commerce",
    ),
    releaseSha,
    releaseRef: optional("RELEASE_REF", "main"),
    adminEmail: optional(
      "BOOTSTRAP_ADMIN_EMAIL",
      "mushfiqueyeasir@gmail.com",
    ).toLowerCase(),
    adminPassword: required("BOOTSTRAP_ADMIN_PASSWORD"),
    workflowRunId: optional("GITHUB_RUN_ID", "local"),
    projectName: `store-${clientId}`,
  };
  if (config.adminPassword.length < 10) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD must contain at least 10 characters",
    );
  }
  return config;
}

function provisioningIdentity(config) {
  const input = {
    clientId: config.clientId,
    displayName: config.displayName,
    siteUrl: config.siteUrl,
    aliasUrl: config.aliasUrl,
    contactEmail: config.contactEmail,
    contactPhone: config.contactPhone,
    storeAddress: config.storeAddress,
    currency: config.currency,
    currencySymbol: config.currencySymbol,
    shippingFlat: config.shippingFlat,
    freeShippingThreshold: config.freeShippingThreshold,
  };
  return sha256(JSON.stringify(input));
}

function validateRegistryPreflight(config) {
  const targetDirectory = join(clientsDirectory, config.clientId);
  if (existsSync(targetDirectory)) {
    throw new Error(
      `Client is already registered: backend/clients/${config.clientId}`,
    );
  }
  const requestedDomains = new Set(
    [config.siteUrl, config.aliasUrl].filter(Boolean),
  );
  for (const { manifest } of loadAllClients()) {
    const registered = [
      manifest.domains?.production,
      ...(manifest.domains?.aliases ?? []),
    ];
    for (const domain of registered) {
      if (requestedDomains.has(domain))
        throw new Error(
          `Domain is already registered to ${manifest.id}: ${domain}`,
        );
    }
    if (manifest.vercel?.projectName === config.projectName) {
      throw new Error(`Vercel project is already registered to ${manifest.id}`);
    }
  }
}

async function supabaseRequest(config, path, options = {}) {
  return requestJson(`${SUPABASE_API}${path}`, {
    token: config.supabaseToken,
    ...options,
  });
}

async function resolveSupabaseOrganization(config) {
  if (config.supabaseOrganizationSlug) return;
  const response = await supabaseRequest(config, "/v1/organizations");
  const organizations = Array.isArray(response)
    ? response
    : (response?.organizations ?? []);
  const organization = organizations[0];
  if (!organization?.slug) {
    throw new Error(
      "The Supabase token does not have access to an organization",
    );
  }
  config.supabaseOrganizationSlug = organization.slug;
  console.log(`Using Supabase organization ${organization.slug}.`);
}

async function listSupabaseProjects(config) {
  const response = await supabaseRequest(config, "/v1/projects");
  return Array.isArray(response) ? response : (response?.projects ?? []);
}

async function findSupabaseProject(config, projects) {
  for (const project of projects.filter(
    (candidate) => candidate.name === config.projectName,
  )) {
    const organizationSlug =
      project.organization_slug ?? project.organization?.slug;
    if (organizationSlug === config.supabaseOrganizationSlug) return project;
    if (!organizationSlug && project.ref) {
      const details = await supabaseRequest(
        config,
        `/v1/projects/${encodeURIComponent(project.ref)}`,
      );
      if (details?.organization_slug === config.supabaseOrganizationSlug) {
        return { ...project, ...details };
      }
    }
  }
  return null;
}

async function waitForSupabase(config, projectRef) {
  const deadline = Date.now() + 15 * 60_000;
  const services = "auth,db,rest,storage";
  while (Date.now() < deadline) {
    try {
      const health = await supabaseRequest(
        config,
        `/v1/projects/${projectRef}/health?services=${services}`,
      );
      const checks = Array.isArray(health) ? health : (health?.services ?? []);
      if (
        checks.length >= 4 &&
        checks.every((check) => check.status === "ACTIVE_HEALTHY")
      )
        return;
    } catch (error) {
      if (
        !(error instanceof HttpError) ||
        ![404, 429, 500, 502, 503].includes(error.status)
      )
        throw error;
    }
    await sleep(10_000);
  }
  throw new Error(`Supabase project did not become healthy: ${projectRef}`);
}

async function createOrResumeSupabase(config) {
  const projects = await listSupabaseProjects(config);
  const existing = await findSupabaseProject(config, projects);
  if (existing && config.mode === "provision") {
    throw new Error(
      `Supabase project already exists: ${config.projectName}. Use resume mode only for this workflow's partial run.`,
    );
  }
  if (existing) {
    console.log(`Resuming Supabase project ${existing.ref}.`);
    await waitForSupabase(config, existing.ref);
    return { project: existing, created: false };
  }

  const regions = await supabaseRequest(
    config,
    `/v1/projects/available-regions?organization_slug=${encodeURIComponent(config.supabaseOrganizationSlug)}`,
  );
  const available = Array.isArray(regions)
    ? regions
    : (regions?.all?.specific ??
      regions?.recommendations?.specific ??
      regions?.regions ??
      []);
  const regionCodes = available.map((region) => region.code).filter(Boolean);
  if (regionCodes.length && !regionCodes.includes(config.supabaseRegion)) {
    throw new Error(
      `SUPABASE_REGION is unavailable. Available regions: ${regionCodes.join(", ")}`,
    );
  }

  const databasePassword = generateDatabasePassword();
  maskSecret(databasePassword);
  const body = {
    name: config.projectName,
    organization_slug: config.supabaseOrganizationSlug,
    db_pass: databasePassword,
    region_selection: { type: "specific", code: config.supabaseRegion },
    ...(config.supabaseInstanceSize
      ? { desired_instance_size: config.supabaseInstanceSize }
      : {}),
  };
  const project = await supabaseRequest(config, "/v1/projects", {
    method: "POST",
    body,
    expected: [201],
  });
  if (!project?.ref)
    throw new Error(
      "Supabase create-project response did not include a project ref",
    );
  console.log(`Created Supabase project ${project.ref}.`);
  await waitForSupabase(config, project.ref);
  return { project, created: true };
}

async function runSql(config, projectRef, query, { readOnly = false } = {}) {
  return supabaseRequest(config, `/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    body: { query, read_only: readOnly },
    expected: [201],
  });
}

async function readMigrationLedger(config, projectRef) {
  const existenceResponse = await runSql(
    config,
    projectRef,
    "select to_regclass('provisioning.schema_migrations')::text as relation",
    { readOnly: true },
  );
  if (!responseRows(existenceResponse)[0]?.relation) return null;

  const response = await runSql(
    config,
    projectRef,
    "select migration_name, checksum from provisioning.schema_migrations order by migration_name",
    { readOnly: true },
  );
  return new Map(
    responseRows(response).map((row) => [row.migration_name, row.checksum]),
  );
}

function migrationLedgerSql(name, checksum, config) {
  return `
create schema if not exists provisioning;
create table if not exists provisioning.schema_migrations (
  migration_name text primary key,
  checksum text not null,
  release_sha text not null,
  workflow_run_id text not null,
  applied_at timestamptz not null default now()
);
insert into provisioning.schema_migrations
  (migration_name, checksum, release_sha, workflow_run_id)
values
  (${sqlLiteral(name)}, ${sqlLiteral(checksum)}, ${sqlLiteral(config.releaseSha)}, ${sqlLiteral(config.workflowRunId)})
on conflict (migration_name) do nothing;
`;
}

function storeIdentitySql(config) {
  return `
create table if not exists provisioning.store_identity (
  singleton boolean primary key default true check (singleton),
  client_id text not null unique,
  input_hash text not null,
  created_at timestamptz not null default now()
);
insert into provisioning.store_identity (singleton, client_id, input_hash)
values (true, ${sqlLiteral(config.clientId)}, ${sqlLiteral(provisioningIdentity(config))});
`;
}

async function verifyStoreIdentity(config, projectRef) {
  const response = await runSql(
    config,
    projectRef,
    "select client_id, input_hash from provisioning.store_identity where singleton = true",
    { readOnly: true },
  );
  const identity = responseRows(response)[0];
  if (!identity) throw new Error("Supabase provisioning identity is missing");
  if (
    identity.client_id !== config.clientId ||
    identity.input_hash !== provisioningIdentity(config)
  ) {
    throw new Error(
      "Resume inputs do not match the Supabase provisioning identity",
    );
  }
}

async function applyDatabase(config, projectRef, projectCreated) {
  const baselinePath = join(
    repositoryRoot,
    "backend",
    "supabase",
    "baselines",
    "v1_0018_clean.sql",
  );
  const migrationsPath = join(
    repositoryRoot,
    "backend",
    "supabase",
    "migrations",
  );
  const baseline = readFileSync(baselinePath, "utf8");
  const migrationFiles = readdirSync(migrationsPath)
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .filter((name) => Number(name.slice(0, 4)) > 18)
    .sort();
  if (!migrationFiles.length)
    throw new Error("No post-baseline migrations were found");

  let ledger = await readMigrationLedger(config, projectRef);
  if (ledger === null) {
    if (!projectCreated) {
      const response = await runSql(
        config,
        projectRef,
        "select to_regclass('public.site_settings')::text as relation",
        { readOnly: true },
      );
      const relation = responseRows(response)[0]?.relation;
      if (relation) {
        throw new Error(
          "Supabase project has a schema but no provisioning migration ledger; refusing unsafe adoption",
        );
      }
    }
    const baselineName = "0018_clean_baseline";
    const baselineChecksum = sha256(baseline);
    const commitAt = baseline.toLowerCase().lastIndexOf("commit;");
    if (commitAt < 0)
      throw new Error("Clean baseline does not end with a transaction commit");
    const atomicBaseline = `${baseline.slice(0, commitAt)}${migrationLedgerSql(baselineName, baselineChecksum, config)}\n${storeIdentitySql(config)}\n${baseline.slice(commitAt)}`;
    console.log(`Applying ${baselineName}.`);
    await runSql(config, projectRef, atomicBaseline);
    ledger = new Map([[baselineName, baselineChecksum]]);
  } else {
    await verifyStoreIdentity(config, projectRef);
  }

  const applied = {};
  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationsPath, file), "utf8");
    const checksum = sha256(sql);
    const existing = ledger.get(file);
    if (existing && existing !== checksum)
      throw new Error(`Migration checksum mismatch: ${file}`);
    if (!existing) {
      console.log(`Applying ${file}.`);
      const wrapped = `begin;\nselect pg_advisory_xact_lock(hashtextextended('reverb-commerce:migrations', 0));\n${sql}\n${migrationLedgerSql(file, checksum, config)}\ncommit;`;
      await runSql(config, projectRef, wrapped);
      ledger.set(file, checksum);
    }
    applied[file] = checksum;
  }
  return {
    latestVersion: migrationFiles.at(-1).slice(0, 4),
    checksums: applied,
  };
}

async function revealApiKey(config, projectRef, entry) {
  const current = entry?.api_key;
  if (current && !current.includes("...") && current.length > 24)
    return current;
  if (!entry?.id)
    throw new Error(
      `Supabase API key ${entry?.name ?? entry?.type ?? "unknown"} cannot be revealed`,
    );
  const revealed = await supabaseRequest(
    config,
    `/v1/projects/${projectRef}/api-keys/${encodeURIComponent(entry.id)}?reveal=true`,
  );
  if (!revealed?.api_key)
    throw new Error(`Supabase did not reveal API key ${entry.id}`);
  return revealed.api_key;
}

async function getSupabaseKeys(config, projectRef) {
  const response = await supabaseRequest(
    config,
    `/v1/projects/${projectRef}/api-keys`,
  );
  const keys = Array.isArray(response) ? response : (response?.keys ?? []);
  const publishableEntry =
    keys.find((key) => key.type === "publishable" && key.name === "default") ??
    keys.find((key) => key.type === "publishable") ??
    keys.find((key) => key.type === "legacy" && key.name === "anon");
  const secretEntry =
    keys.find((key) => key.type === "secret" && key.name === "default") ??
    keys.find((key) => key.type === "secret") ??
    keys.find((key) => key.type === "legacy" && key.name === "service_role");
  if (!publishableEntry || !secretEntry)
    throw new Error("Supabase project API keys are incomplete");
  const publishableKey = await revealApiKey(
    config,
    projectRef,
    publishableEntry,
  );
  const secretKey = await revealApiKey(config, projectRef, secretEntry);
  maskSecret(publishableKey);
  maskSecret(secretKey);
  return { publishableKey, secretKey };
}

async function uploadPlaceholderAssets(projectUrl, secretKey) {
  const supabase = createClient(projectUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  for (const asset of buildPlaceholderAssets()) {
    const { error } = await supabase.storage
      .from(asset.bucket)
      .upload(asset.path, asset.content, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });
    if (error && !/already exists|duplicate/i.test(error.message)) {
      throw new Error(
        `Failed to upload ${asset.bucket}/${asset.path}: ${error.message}`,
      );
    }
  }
}

async function seedStore(config, projectRef) {
  const templatePath = join(
    repositoryRoot,
    "backend",
    "supabase",
    "seeds",
    "store-template.sql",
  );
  const template = readFileSync(templatePath, "utf8");
  const rendered = renderSqlTemplate(template, {
    STORE_NAME: config.displayName,
    CONTACT_EMAIL: config.contactEmail,
    CONTACT_PHONE: config.contactPhone,
    STORE_ADDRESS: config.storeAddress,
    CURRENCY: config.currency,
    CURRENCY_SYMBOL: config.currencySymbol,
    SHIPPING_FLAT: config.shippingFlat,
    FREE_SHIPPING_THRESHOLD: config.freeShippingThreshold,
  });
  await runSql(config, projectRef, rendered);
}

async function configureAuthAndAdmin(
  config,
  projectRef,
  projectUrl,
  secretKey,
) {
  const allowed = [config.siteUrl, config.aliasUrl]
    .filter(Boolean)
    .flatMap((url) => [url, `${url}/**`])
    .join(",");
  await supabaseRequest(config, `/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    body: {
      site_url: config.siteUrl,
      uri_allow_list: allowed,
      disable_signup: true,
      external_anonymous_users_enabled: false,
      external_email_enabled: true,
      external_phone_enabled: false,
      mailer_autoconfirm: false,
      password_min_length: 10,
      refresh_token_rotation_enabled: true,
    },
  });

  const supabase = createClient(projectUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let user = null;
  let userCount = 0;
  for (let page = 1; ; page += 1) {
    const { data: usersData, error: usersError } =
      await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (usersError) {
      throw new Error(
        `Unable to inspect Supabase Auth users: ${usersError.message}`,
      );
    }
    userCount += usersData.users.length;
    user ??= usersData.users.find(
      (candidate) => candidate.email?.toLowerCase() === config.adminEmail,
    );
    if (usersData.users.length < 100 || user) break;
  }
  if (!user) {
    if (userCount)
      throw new Error(
        "Supabase project already has Auth users but not the configured bootstrap administrator",
      );
    const { data, error } = await supabase.auth.admin.createUser({
      email: config.adminEmail,
      password: config.adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "Store Administrator" },
    });
    if (error || !data.user)
      throw new Error(
        `Unable to create bootstrap administrator: ${error?.message ?? "missing user"}`,
      );
    user = data.user;
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin", full_name: "Store Administrator" })
    .eq("id", user.id)
    .select("id, role")
    .maybeSingle();
  if (profileError || profile?.role !== "admin")
    throw new Error(
      `Unable to promote bootstrap administrator: ${profileError?.message ?? "profile was not updated"}`,
    );
}

function vercelUrl(config, path, parameters = {}) {
  const url = new URL(`${VERCEL_API}${path}`);
  if (config.vercelTeamId) {
    url.searchParams.set("teamId", config.vercelTeamId);
  }
  for (const [name, value] of Object.entries(parameters))
    url.searchParams.set(name, value);
  return url.toString();
}

async function resolveVercelTeam(config) {
  if (config.vercelTeamId) return;
  const response = await requestJson(`${VERCEL_API}/v2/teams?limit=100`, {
    token: config.vercelToken,
  });
  const teams = Array.isArray(response) ? response : (response?.teams ?? []);
  const team = teams[0];
  if (team?.id) {
    config.vercelTeamId = team.id;
    console.log(`Using Vercel team ${team.slug ?? team.name ?? team.id}.`);
  } else {
    console.log("Using the Vercel token's personal account scope.");
  }
}

async function vercelRequest(config, path, options = {}, parameters = {}) {
  return requestJson(vercelUrl(config, path, parameters), {
    token: config.vercelToken,
    ...options,
  });
}

async function findVercelProject(config) {
  try {
    return await vercelRequest(
      config,
      `/v9/projects/${encodeURIComponent(config.projectName)}`,
    );
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

async function createOrResumeVercel(config, existingAtPreflight) {
  if (existingAtPreflight && config.mode === "provision") {
    throw new Error(
      `Vercel project already exists: ${config.projectName}. Use resume mode only for this workflow's partial run.`,
    );
  }
  let project = existingAtPreflight;
  if (project && !project.link) {
    throw new Error(
      "Existing Vercel project has no verified Git connection; refusing unsafe adoption",
    );
  }
  if (project?.link) {
    const [expectedOrg, expectedRepo] = config.gitRepository.split("/");
    if (
      project.link.org !== expectedOrg ||
      project.link.repo !== expectedRepo ||
      project.link.productionBranch !== "main"
    ) {
      throw new Error(
        "Existing Vercel project is connected to a different Git repository or branch",
      );
    }
  }
  if (!project) {
    project = await vercelRequest(config, "/v11/projects", {
      method: "POST",
      body: {
        name: config.projectName,
        framework: "nextjs",
        rootDirectory: "frontend/website",
        previewDeploymentsDisabled: true,
        enableAffectedProjectsDeployments: true,
        gitRepository: { type: "github", repo: config.gitRepository },
      },
    });
  }
  await vercelRequest(
    config,
    `/v9/projects/${encodeURIComponent(project.id ?? config.projectName)}`,
    {
      method: "PATCH",
      body: {
        framework: "nextjs",
        rootDirectory: "frontend/website",
        nodeVersion: "22.x",
        previewDeploymentsDisabled: true,
        enableAffectedProjectsDeployments: true,
      },
    },
  );
  return project;
}

async function setVercelEnvironment(config, projectId, projectUrl, keys) {
  const environment = [
    ["SUPABASE_URL", projectUrl, "plain"],
    ["SUPABASE_ANON_KEY", keys.publishableKey, "sensitive"],
    ["SUPABASE_SERVICE_ROLE_KEY", keys.secretKey, "sensitive"],
    ["SITE_URL", config.siteUrl, "plain"],
    ["SECURITY_ENABLED", "true", "plain"],
  ].map(([key, value, type]) => ({ key, value, type, target: ["production"] }));
  const result = await vercelRequest(
    config,
    `/v10/projects/${encodeURIComponent(projectId)}/env`,
    { method: "POST", body: environment, expected: [201] },
    { upsert: "true" },
  );
  const failed = Array.isArray(result?.failed) ? result.failed : [];
  if (failed.length) {
    throw new Error(
      `Vercel failed to set environment variables: ${failed.map((entry) => entry.key ?? "unknown").join(", ")}`,
    );
  }
}

async function createDeployment(config, project) {
  const [gitOrg, gitRepo] = config.gitRepository.split("/");
  if (!gitOrg || !gitRepo)
    throw new Error("VERCEL_GIT_REPOSITORY must use owner/repository format");
  const deployment = await vercelRequest(config, "/v13/deployments", {
    method: "POST",
    body: {
      name: config.projectName,
      project: project.id,
      target: "production",
      gitSource: {
        type: "github",
        org: gitOrg,
        repo: gitRepo,
        ref: config.releaseRef,
        sha: config.releaseSha,
      },
    },
  });
  if (!deployment?.id)
    throw new Error("Vercel deployment response did not include an ID");
  const deadline = Date.now() + 20 * 60_000;
  while (Date.now() < deadline) {
    const current = await vercelRequest(
      config,
      `/v13/deployments/${deployment.id}`,
    );
    if (current.readyState === "READY") return current;
    if (["ERROR", "CANCELED", "BLOCKED"].includes(current.readyState)) {
      throw new Error(
        `Vercel deployment failed with state ${current.readyState}`,
      );
    }
    await sleep(8_000);
  }
  throw new Error(`Vercel deployment timed out: ${deployment.id}`);
}

async function readProjectDomain(config, projectId, hostname) {
  try {
    return await vercelRequest(
      config,
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(hostname)}`,
    );
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

async function attachDomain(config, projectId, url, redirectUrl = "") {
  const hostname = new URL(url).hostname;
  const redirect = redirectUrl ? new URL(redirectUrl).hostname : "";
  let domain = await readProjectDomain(config, projectId, hostname);
  if (!domain) {
    domain = await vercelRequest(
      config,
      `/v10/projects/${encodeURIComponent(projectId)}/domains`,
      {
        method: "POST",
        body: {
          name: hostname,
          ...(redirect ? { redirect, redirectStatusCode: 308 } : {}),
        },
      },
    );
  } else if (
    redirect &&
    (domain.redirect !== redirect || domain.redirectStatusCode !== 308)
  ) {
    domain = await vercelRequest(
      config,
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(hostname)}`,
      { method: "PATCH", body: { redirect, redirectStatusCode: 308 } },
    );
  }
  if (domain?.verified === false) {
    domain = await vercelRequest(
      config,
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(hostname)}/verify`,
      { method: "POST", body: {} },
    );
  }
  return hostname;
}

async function waitForDomain(config, projectId, hostname) {
  const deadline = Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    try {
      const result = await vercelRequest(
        config,
        `/v6/domains/${encodeURIComponent(hostname)}/config`,
        {},
        { projectIdOrName: projectId },
      );
      if (result?.misconfigured === false) return;
    } catch (error) {
      if (
        !(error instanceof HttpError) ||
        ![400, 404, 409].includes(error.status)
      )
        throw error;
    }
    await sleep(10_000);
  }
  throw new Error(
    `Domain is not correctly configured in Vercel DNS: ${hostname}`,
  );
}

async function fetchHealthy(url, attempts = 10) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
        headers: { "User-Agent": "reverb-provisioner/1" },
      });
      lastStatus = response.status;
      if (response.ok) return response;
    } catch {
      lastStatus = 0;
    }
    await sleep(8_000);
  }
  throw new Error(
    `Smoke test failed for ${url} (last status ${lastStatus || "network error"})`,
  );
}

async function runSmokeTests(config, deployment) {
  const deploymentHost = deployment.url.startsWith("http")
    ? deployment.url
    : `https://${deployment.url}`;
  const health = await fetchHealthy(`${deploymentHost}/api/health`, 15);
  const body = await health.json();
  if (body?.status !== "ok")
    throw new Error("Deployment health endpoint reported an unhealthy store");
  for (const path of [
    "/",
    "/product",
    "/about-us",
    "/privacy-policy",
    "/terms-of-service",
    "/admin/login",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    await fetchHealthy(`${config.siteUrl}${path}`, 15);
  }
  if (config.aliasUrl) {
    const response = await fetch(config.aliasUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
      headers: { "User-Agent": "reverb-provisioner/1" },
    });
    const location = response.headers.get("location");
    if (response.status !== 308 || !location?.startsWith(config.siteUrl)) {
      throw new Error(
        "Alias domain did not return the expected permanent canonical redirect",
      );
    }
    await fetchHealthy(config.aliasUrl, 5);
  }
}

function writeClientRegistry(config, state) {
  const directory = join(clientsDirectory, config.clientId);
  if (existsSync(directory))
    throw new Error(
      `Client registry directory appeared during provisioning: ${config.clientId}`,
    );
  mkdirSync(directory);
  const aliases = config.aliasUrl ? [config.aliasUrl] : [];
  const tenant = {
    $schema: "../../../ops/schemas/tenant-manifest.schema.json",
    id: config.clientId,
    displayName: config.displayName,
    status: "active",
    domains: { production: config.siteUrl, aliases },
    vercel: {
      projectName: config.projectName,
      rootDirectory: "frontend/website",
      productionBranch: "main",
    },
    supabase: {
      projectRef: state.projectRef,
      url: state.projectUrl,
      schemaVersion: state.latestVersion,
    },
  };
  const deployment = {
    status: "ready",
    vercelProjectId: state.vercelProject.id,
    vercelProjectName: config.projectName,
    productionDomain: config.siteUrl,
    domainAliases: aliases,
    deploymentId: state.deployment.id,
    lastProvisionedDeploymentUrl: state.deployment.url.startsWith("http")
      ? state.deployment.url
      : `https://${state.deployment.url}`,
    deployedCommitSha: config.releaseSha,
    supabaseProjectRef: state.projectRef,
    supabaseUrl: state.projectUrl,
    schemaVersion: state.latestVersion,
    migrationChecksums: state.migrationChecksums,
    domainVerified: true,
    sslReady: true,
    smokeTestsPassed: true,
    workflowRunId: config.workflowRunId,
    trackedAt: new Date().toISOString(),
  };
  const publicEnvironment = {
    SUPABASE_URL: state.projectUrl,
    SUPABASE_ANON_KEY: state.publishableKey,
    SUPABASE_SERVICE_ROLE_KEY: "",
    SUPABASE_ACCESS_TOKEN: "",
    SITE_URL: config.siteUrl,
    SECURITY_ENABLED: "true",
  };
  const environmentBackup = {
    formatVersion: 2,
    purpose:
      "Non-secret environment inventory. Privileged credentials intentionally remain blank.",
    clientId: config.clientId,
    sources: {
      "frontend/website/.env": publicEnvironment,
      [`frontend/website/.env.${config.clientId}`]: publicEnvironment,
    },
  };
  const readme = `# ${config.displayName}\n\nProduction storefront: ${config.siteUrl}\n\nAdmin: ${config.siteUrl}/admin/login\n\nVercel project: \`${config.projectName}\`\n\nSupabase project: \`${state.projectRef}\`\n\nThe store is provisioned with sample content. Replace placeholder content and integration settings before promoting the storefront.\n\nPrivileged values are intentionally blank in \`environment.backup.json\`. Pull local credentials through the approved environment tooling; never commit service-role keys, access tokens, or passwords.\n\n## Local development\n\n\`\`\`bash\ncd backend\nnpm run client:env:pull -- --client ${config.clientId}\n\ncd ../frontend/website\nnpm run dev:client -- ${config.clientId}\n\`\`\`\n`;

  writeFileSync(
    join(directory, "tenant.json"),
    `${JSON.stringify(tenant, null, 2)}\n`,
  );
  writeFileSync(
    join(directory, "deployment.json"),
    `${JSON.stringify(deployment, null, 2)}\n`,
  );
  writeFileSync(
    join(directory, "environment.backup.json"),
    `${JSON.stringify(environmentBackup, null, 2)}\n`,
  );
  writeFileSync(join(directory, "README.md"), readme);
}

async function main() {
  const config = getConfig();
  maskSecret(config.supabaseToken);
  maskSecret(config.vercelToken);
  maskSecret(config.adminPassword);
  validateRegistryPreflight(config);
  console.log(`Provisioning ${config.clientId} from ${config.releaseSha}.`);

  await Promise.all([
    resolveSupabaseOrganization(config),
    resolveVercelTeam(config),
  ]);

  const [supabaseProjects, existingVercel] = await Promise.all([
    listSupabaseProjects(config),
    findVercelProject(config),
  ]);
  const existingSupabase = await findSupabaseProject(config, supabaseProjects);
  if (config.mode === "provision" && existingSupabase) {
    throw new Error(`Supabase project already exists: ${config.projectName}`);
  }
  if (config.mode === "provision" && existingVercel) {
    throw new Error(`Vercel project already exists: ${config.projectName}`);
  }

  const { project: supabaseProject, created } =
    await createOrResumeSupabase(config);
  const projectRef = supabaseProject.ref;
  const projectUrl = `https://${projectRef}.supabase.co`;
  const database = await applyDatabase(config, projectRef, created);
  const keys = await getSupabaseKeys(config, projectRef);

  await uploadPlaceholderAssets(projectUrl, keys.secretKey);
  await seedStore(config, projectRef);
  await configureAuthAndAdmin(config, projectRef, projectUrl, keys.secretKey);

  const vercelProject = await createOrResumeVercel(config, existingVercel);
  await setVercelEnvironment(config, vercelProject.id, projectUrl, keys);
  const deployment = await createDeployment(config, vercelProject);
  await fetchHealthy(
    `${deployment.url.startsWith("http") ? deployment.url : `https://${deployment.url}`}/api/health`,
    15,
  );

  const primaryHost = await attachDomain(
    config,
    vercelProject.id,
    config.siteUrl,
  );
  await waitForDomain(config, vercelProject.id, primaryHost);
  if (config.aliasUrl) {
    const aliasHost = await attachDomain(
      config,
      vercelProject.id,
      config.aliasUrl,
      config.siteUrl,
    );
    await waitForDomain(config, vercelProject.id, aliasHost);
  }
  await runSmokeTests(config, deployment);

  writeClientRegistry(config, {
    projectRef,
    projectUrl,
    publishableKey: keys.publishableKey,
    latestVersion: database.latestVersion,
    migrationChecksums: database.checksums,
    vercelProject,
    deployment,
  });

  output("client_id", config.clientId);
  output("client_directory", `backend/clients/${config.clientId}`);
  output("production_url", config.siteUrl);
  output("vercel_project_id", vercelProject.id);
  output("supabase_project_ref", projectRef);
  summary(
    `## Provisioned ${config.displayName}\n\n- Store: ${config.siteUrl}\n- Vercel: \`${config.projectName}\`\n- Supabase: \`${projectRef}\`\n- Schema: \`${database.latestVersion}\`\n- Registry: \`backend/clients/${config.clientId}\``,
  );
  console.log(`Provisioned and verified ${config.clientId}.`);
}

await main();
