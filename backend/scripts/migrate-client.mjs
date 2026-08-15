import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import {
  assertMigrationStoreIdentity,
  requestJson,
  responseRows,
  sha256,
  sqlLiteral,
} from "./provisioning-core.mjs";

const SUPABASE_API = "https://api.supabase.com";
const args = parseArguments();
if (typeof args.client !== "string") {
  throw new Error("Usage: npm run client:migrate -- --client <id> [--dry-run]");
}

const { manifest, manifestPath } = loadClient(args.client);
const dryRun = args["dry-run"] === true;
const secretPath = join(repositoryRoot, ".client-secrets", `${manifest.id}.env`);
const secrets = parseEnvFile(secretPath);
const managementToken = secrets.SUPABASE_ACCESS_TOKEN?.trim();
if (!managementToken) throw new Error(`SUPABASE_ACCESS_TOKEN is missing in ${secretPath}`);

const releaseSha = (() => {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error("Unable to resolve the current Git SHA");
  return result.stdout.trim();
})();
const gitStatus = spawnSync("git", ["status", "--porcelain"], {
  cwd: repositoryRoot,
  encoding: "utf8",
});
if (gitStatus.status !== 0) throw new Error("Unable to inspect the Git worktree");
if (!dryRun && gitStatus.stdout.trim()) {
  throw new Error("Commit migration changes before applying them");
}

const migrationsDirectory = join(
  repositoryRoot,
  "backend",
  "supabase",
  "migrations",
);
const baselinePath = join(
  repositoryRoot,
  "backend",
  "supabase",
  "baselines",
  "v1_0018_clean.sql",
);
const migrationRecords = [
  {
    version: "0018",
    name: "0018_clean_baseline",
    path: baselinePath,
    sql: readFileSync(baselinePath, "utf8"),
  },
  ...readdirSync(migrationsDirectory)
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort()
    .filter((name) => name.slice(0, 4) > "0018")
    .map((name) => {
      const path = join(migrationsDirectory, name);
      return {
        version: name.slice(0, 4),
        name,
        path,
        sql: readFileSync(path, "utf8"),
      };
    }),
].map((record) => ({
  ...record,
  checksum: sha256(record.sql.replaceAll("\r\n", "\n")),
}));

const target = migrationRecords.at(-1);
if (!target) throw new Error("No migration target was found");
const legacyRepairRecords = [
  {
    key: "legacy-cms-0006",
    tables: ["banners", "homepage_sections"],
    path: join(migrationsDirectory, "0006_cms.sql"),
  },
  {
    key: "legacy-content-pages-0007",
    tables: ["content_pages"],
    path: join(migrationsDirectory, "0007_page_content.sql"),
  },
].map((record) => {
  const sql = readFileSync(record.path, "utf8");
  return {
    ...record,
    sql,
    checksum: sha256(sql.replaceAll("\r\n", "\n")),
  };
});

async function managementRequest(path, options = {}) {
  return requestJson(`${SUPABASE_API}${path}`, {
    token: managementToken,
    ...options,
  });
}

async function runSql(query, readOnly = false) {
  return managementRequest(
    `/v1/projects/${manifest.supabase.projectRef}/database/query`,
    {
      method: "POST",
      body: { query, read_only: readOnly },
      expected: [201],
    },
  );
}

async function readStoreIdentityClientId() {
  const relation = responseRows(
    await runSql(
      "select to_regclass('provisioning.store_identity')::text as relation",
      true,
    ),
  )[0]?.relation;
  if (!relation) return null;
  return (
    responseRows(
      await runSql(
        "select client_id from provisioning.store_identity where singleton = true",
        true,
      ),
    )[0]?.client_id ?? null
  );
}

async function readLegacyProjectBinding() {
  const relation = responseRows(
    await runSql(
      "select to_regclass('provisioning.client_registry_bindings')::text as relation",
      true,
    ),
  )[0]?.relation;
  if (!relation) return null;
  return (
    responseRows(
      await runSql(
        `select client_id, project_ref
        from provisioning.client_registry_bindings
        where project_ref = ${sqlLiteral(manifest.supabase.projectRef)}
        limit 1`,
        true,
      ),
    )[0] ?? null
  );
}

async function readCmsRestorations() {
  const relation = responseRows(
    await runSql(
      "select to_regclass('provisioning.cms_fallback_restorations')::text as relation",
      true,
    ),
  )[0]?.relation;
  if (!relation) return [];
  return responseRows(
    await runSql(
      `select entity from provisioning.cms_fallback_restorations
      where client_id = ${sqlLiteral(manifest.id)}
      order by entity`,
      true,
    ),
  ).map((row) => row.entity);
}

async function readRepairLedger() {
  const relation = responseRows(
    await runSql(
      "select to_regclass('provisioning.schema_repairs')::text as relation",
      true,
    ),
  )[0]?.relation;
  if (!relation) return [];
  return responseRows(
    await runSql(
      "select repair_key, checksum from provisioning.schema_repairs order by repair_key",
      true,
    ),
  );
}

async function readLedger() {
  const relation = responseRows(
    await runSql(
      "select to_regclass('provisioning.schema_migrations')::text as relation",
      true,
    ),
  )[0]?.relation;
  if (!relation) return null;
  return responseRows(
    await runSql(
      "select migration_name, checksum, release_sha, applied_at from provisioning.schema_migrations order by migration_name",
      true,
    ),
  );
}

const expectedTables = [
  "profiles",
  "categories",
  "products",
  "product_images",
  "product_variants",
  "product_categories",
  "customers",
  "orders",
  "order_items",
  "promotions",
  "reviews",
  "site_settings",
  "banners",
  "homepage_sections",
  "content_pages",
  "audit_logs",
  "promo_codes",
  "email_smtp_settings",
  "bkash_settings",
  "courier_settings",
  "order_shipments",
  "courier_events",
];

async function readMissingTables() {
  const values = expectedTables
    .map((name) => `(${sqlLiteral(name)}, to_regclass(${sqlLiteral(`public.${name}`)}))`)
    .join(",");
  return responseRows(
    await runSql(
      `select name from (values ${values}) as expected(name, relation) where relation is null order by name`,
      true,
    ),
  ).map((row) => row.name);
}

async function readCmsFallbackCounts() {
  return responseRows(
    await runSql(
      `select
        coalesce(jsonb_array_length(socials #> '{_cms,banners}'), 0)::int as banners,
        coalesce(jsonb_array_length(socials #> '{_cms,homepage_sections}'), 0)::int as sections,
        coalesce((select count(*)::int from jsonb_object_keys(socials #> '{_cms,pages}')), 0)::int as pages
      from public.site_settings
      where id = 1`,
      true,
    ),
  )[0] ?? { banners: 0, sections: 0, pages: 0 };
}

async function verifyAdoption(version) {
  const checks = responseRows(
    await runSql(
      `select
        exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'products' and column_name = 'sizing_mode'
        ) as has_0020,
        exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'site_settings' and column_name = 'invoice_logo_path'
        ) as has_0021`,
      true,
    ),
  )[0];
  if (version >= "0020" && !checks?.has_0020) {
    throw new Error("Cannot adopt 0020: products.sizing_mode is missing");
  }
  if (version >= "0021" && !checks?.has_0021) {
    throw new Error("Cannot adopt 0021: site_settings.invoice_logo_path is missing");
  }
}

function ledgerSchemaSql() {
  return `
create schema if not exists provisioning;
create table if not exists provisioning.schema_migrations (
  migration_name text primary key,
  checksum text not null,
  release_sha text not null,
  workflow_run_id text not null,
  applied_at timestamptz not null default now()
);`;
}

function ledgerInsertSql(record, workflowRunId) {
  return `
insert into provisioning.schema_migrations
  (migration_name, checksum, release_sha, workflow_run_id)
values
  (${sqlLiteral(record.name)}, ${sqlLiteral(record.checksum)}, ${sqlLiteral(releaseSha)}, ${sqlLiteral(workflowRunId)})
on conflict (migration_name) do nothing;`;
}

function legacyProjectBindingSql() {
  return `
create table if not exists provisioning.client_registry_bindings (
  client_id text primary key,
  project_ref text not null unique,
  bound_at timestamptz not null default now()
);
insert into provisioning.client_registry_bindings (client_id, project_ref)
values (${sqlLiteral(manifest.id)}, ${sqlLiteral(manifest.supabase.projectRef)})
on conflict (client_id) do update
set project_ref = excluded.project_ref;
`;
}

const missingTables = await readMissingTables();
const cmsFallbackCounts = await readCmsFallbackCounts();
const restoredCmsEntities = new Set(await readCmsRestorations());
const repairLedger = await readRepairLedger();
const repairsByKey = new Map(
  legacyRepairRecords.map((record) => [record.key, record]),
);
for (const row of repairLedger) {
  const local = repairsByKey.get(row.repair_key);
  if (local && local.checksum !== row.checksum) {
    throw new Error(`Repair checksum mismatch: ${row.repair_key}`);
  }
}
let ledger = await readLedger();
const hadLedger = ledger !== null;
const storeIdentityClientId = await readStoreIdentityClientId();
const legacyProjectBinding =
  storeIdentityClientId === null ? await readLegacyProjectBinding() : null;
const hasMatchingLegacyBinding =
  legacyProjectBinding?.client_id === manifest.id &&
  legacyProjectBinding?.project_ref === manifest.supabase.projectRef;
assertMigrationStoreIdentity(storeIdentityClientId, manifest.id, {
  allowMissing:
    dryRun ||
    hasMatchingLegacyBinding ||
    (!hadLedger &&
      args["adopt-manifest"] === true &&
      args["bind-project"] === true),
});
let adoption = [];
if (!ledger) {
  if (!dryRun && args["adopt-manifest"] !== true) {
    throw new Error("Unledgered schemas require explicit --adopt-manifest approval");
  }
  const adoptThrough = manifest.supabase.schemaVersion;
  adoption = migrationRecords.filter((record) => record.version <= adoptThrough);
  if (adoption.length === 0 || adoption.at(-1).version !== adoptThrough) {
    throw new Error(`Tracked schema version cannot be adopted: ${adoptThrough}`);
  }
  await verifyAdoption(adoptThrough);
  if (!dryRun) {
    const adoptionSql = adoption
      .map((record) => ledgerInsertSql(record, "local-schema-adoption"))
      .join("\n");
    const bindingSql =
      storeIdentityClientId === null && args["bind-project"] === true
        ? legacyProjectBindingSql()
        : "";
    await runSql(
      `begin;${ledgerSchemaSql()}${adoptionSql}\n${bindingSql}\ncommit;`,
    );
    ledger = await readLedger();
  } else {
    ledger = [];
  }
}

const localByName = new Map(migrationRecords.map((record) => [record.name, record]));
for (const row of ledger ?? []) {
  const local = localByName.get(row.migration_name);
  if (local && local.checksum !== row.checksum) {
    throw new Error(`Migration checksum mismatch: ${row.migration_name}`);
  }
}

const appliedNames = new Set((ledger ?? []).map((row) => row.migration_name));
for (const record of adoption) appliedNames.add(record.name);
const pending = migrationRecords.filter((record) => !appliedNames.has(record.name));
const repairs = legacyRepairRecords.filter((record) =>
  record.tables.some((table) => missingTables.includes(table)),
);
const recordedRepairKeys = new Set(repairLedger.map((row) => row.repair_key));
const pendingRestores = [];
if (
  (missingTables.includes("banners") ||
    recordedRepairKeys.has("legacy-cms-0006")) &&
  cmsFallbackCounts.banners > 0 &&
  !restoredCmsEntities.has("banners")
) {
  pendingRestores.push("banners");
}
if (
  (missingTables.includes("homepage_sections") ||
    recordedRepairKeys.has("legacy-cms-0006")) &&
  cmsFallbackCounts.sections > 0 &&
  !restoredCmsEntities.has("homepage_sections")
) {
  pendingRestores.push("sections");
}
if (
  (missingTables.includes("content_pages") ||
    recordedRepairKeys.has("legacy-content-pages-0007")) &&
  cmsFallbackCounts.pages > 0 &&
  !restoredCmsEntities.has("content_pages")
) {
  pendingRestores.push("pages");
}

if (!dryRun) {
  for (const repair of repairs) {
    await runSql(`
begin;
${repair.sql}
create table if not exists provisioning.schema_repairs (
  repair_key text primary key,
  checksum text not null,
  release_sha text not null,
  applied_at timestamptz not null default now()
);
insert into provisioning.schema_repairs (repair_key, checksum, release_sha)
values (${sqlLiteral(repair.key)}, ${sqlLiteral(repair.checksum)}, ${sqlLiteral(releaseSha)})
on conflict (repair_key) do nothing;
commit;`);
  }
  const remainingTables = await readMissingTables();
  if (remainingTables.length > 0) {
    throw new Error(`Missing required tables: ${remainingTables.join(", ")}`);
  }
  for (const record of pending) {
    await runSql(
      `begin;\n${record.sql}\n${ledgerInsertSql(record, "local-client-migration")}\ncommit;`,
    );
  }
  const restoreArgs = [
    join(repositoryRoot, "backend", "scripts", "restore-client-cms.mjs"),
    "--client",
    manifest.id,
  ];
  for (const entity of pendingRestores) restoreArgs.push(`--${entity}`);
  if (args["bind-project"] === true) restoreArgs.push("--bind-project");
  if (pendingRestores.length > 0) {
    const restore = spawnSync(process.execPath, restoreArgs, {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    if (restore.status !== 0) {
      throw new Error(restore.stderr.trim() || "CMS fallback restoration failed");
    }
  }
  if (args["record-release"] === true) {
    await runSql(`
update provisioning.schema_migrations
set release_sha = ${sqlLiteral(releaseSha)}
where workflow_run_id in ('local-client-migration', 'local-schema-adoption');
${repairLedger.length > 0 ? `update provisioning.schema_repairs set release_sha = ${sqlLiteral(releaseSha)};` : ""}`);
  }
  ledger = await readLedger();
  const finalNames = new Set((ledger ?? []).map((row) => row.migration_name));
  if (!migrationRecords.every((record) => finalNames.has(record.name))) {
    throw new Error("Migration ledger is incomplete after reconciliation");
  }

  const checksums = Object.fromEntries(
    (ledger ?? []).map((row) => [row.migration_name, row.checksum]),
  );
  manifest.supabase.schemaVersion = target.version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const deploymentPath = join(dirname(manifestPath), "deployment.json");
  const deployment = existsSync(deploymentPath)
    ? JSON.parse(readFileSync(deploymentPath, "utf8"))
    : {};
  deployment.supabaseProjectRef = manifest.supabase.projectRef;
  deployment.supabaseUrl = manifest.supabase.url;
  deployment.schemaVersion = target.version;
  deployment.migrationChecksums = checksums;
  deployment.trackedAt = new Date().toISOString();
  writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);
}

console.log(
  JSON.stringify({
    clientId: manifest.id,
    projectRef: manifest.supabase.projectRef,
    trackedVersion: manifest.supabase.schemaVersion,
    targetVersion: target.version,
    ledgerExists: hadLedger,
    storeIdentityClientId,
    legacyProjectBinding,
    adopted: adoption.map((record) => record.name),
    pending: pending.map((record) => record.name),
    repairs: repairs.map((record) => record.key),
    missingTables,
    cmsFallbackCounts,
    pendingRestores,
    dryRun,
  }),
);
