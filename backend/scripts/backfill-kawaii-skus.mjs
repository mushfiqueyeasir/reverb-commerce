import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import {
  requestJson,
  responseRows,
  sqlLiteral,
} from "./provisioning-core.mjs";

const SUPABASE_API = "https://api.supabase.com";

function token(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function titleToken(value) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .map(token)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.slice(0, 3))
    .join("-");
}

function optionToken(value) {
  const normalized = token(value);
  if (normalized.length <= 3) return normalized;
  return `${normalized.slice(0, 2)}${normalized.at(-1)}`;
}

export function skuBase(title, color, size) {
  return (
    [titleToken(title), optionToken(color), token(size)]
      .filter(Boolean)
      .join("-") || "SKU"
  );
}

export function planSkuBackfill(rows) {
  const missingVariant = rows.find((row) => !row.variant_id);
  if (missingVariant) {
    throw new Error(`Product has no inventory row: ${missingVariant.product_id}`);
  }
  const occupied = new Set(
    rows
      .map((row) => String(row.sku ?? "").trim().toLowerCase())
      .filter(Boolean),
  );
  const plan = [];
  const missing = rows
    .filter((row) => !String(row.sku ?? "").trim())
    .sort(
      (left, right) =>
        String(left.product_id).localeCompare(String(right.product_id)) ||
        String(left.variant_id).localeCompare(String(right.variant_id)),
    );

  for (const row of missing) {
    const base = skuBase(row.title, row.color, row.size);
    let candidate = base;
    const compactId = token(row.variant_id);
    for (let length = 8; occupied.has(candidate.toLowerCase()); length += 4) {
      candidate = `${base}-${compactId.slice(0, Math.min(length, compactId.length))}`;
      if (length >= compactId.length && occupied.has(candidate.toLowerCase())) {
        let suffix = 2;
        while (occupied.has(`${candidate}-${suffix}`.toLowerCase())) suffix += 1;
        candidate = `${candidate}-${suffix}`;
        break;
      }
    }
    occupied.add(candidate.toLowerCase());
    plan.push({ variant_id: row.variant_id, sku: candidate });
  }
  return plan;
}

function applySql(plan, snapshot) {
  const planned = sqlLiteral(JSON.stringify(plan));
  return `
begin;
select pg_advisory_xact_lock(hashtext('kawaii-sku-backfill-v1'));
lock table public.products in share mode;
lock table public.product_variants in share row exclusive mode;
do $$
declare
  changed integer;
begin
  if (select client_id from provisioning.store_identity where singleton = true) <> 'kawaii' then
    raise exception 'Supabase store identity does not match Kawaii';
  end if;
  if (select count(*) from public.products) <> ${snapshot.products} then
    raise exception 'Product count changed during SKU backfill';
  end if;
  if (select count(*) from public.product_variants) <> ${snapshot.variants} then
    raise exception 'Variant count changed during SKU backfill';
  end if;
  if (select count(*) from public.product_variants where nullif(btrim(sku), '') is null) <> ${snapshot.blankSkus} then
    raise exception 'Blank SKU count changed during SKU backfill';
  end if;

  with planned as (
    select row.variant_id, row.sku
    from jsonb_to_recordset(${planned}::jsonb) as row(variant_id uuid, sku text)
  )
  update public.product_variants variant
  set sku = planned.sku
  from planned
  where variant.id = planned.variant_id
    and nullif(btrim(variant.sku), '') is null;
  get diagnostics changed = row_count;

  if changed <> ${plan.length} then
    raise exception 'Expected to update ${plan.length} SKUs, updated %', changed;
  end if;
  if exists(
    select 1 from public.product_variants where nullif(btrim(sku), '') is null
  ) then
    raise exception 'Blank SKUs remain after backfill';
  end if;
end;
$$;
commit;
`;
}

async function main() {
  const args = parseArguments();
  const { manifest } = loadClient("kawaii");
  const secrets = parseEnvFile(
    resolve(repositoryRoot, ".client-secrets", "kawaii.env"),
  );
  const tokenValue = secrets.SUPABASE_ACCESS_TOKEN?.trim();
  if (!tokenValue) throw new Error("SUPABASE_ACCESS_TOKEN is missing");
  const runSql = (query, readOnly = false) =>
    requestJson(
      `${SUPABASE_API}/v1/projects/${manifest.supabase.projectRef}/database/query`,
      {
        token: tokenValue,
        method: "POST",
        body: { query, read_only: readOnly },
        expected: [201],
      },
    );
  const state = responseRows(
    await runSql(
      `select
        (select client_id from provisioning.store_identity where singleton = true) as client_id,
        (select count(*)::int from public.products) as products,
        (select count(*)::int from public.product_variants) as variants,
        (select count(*)::int from public.product_variants where nullif(btrim(sku), '') is null) as blank_skus`,
      true,
    ),
  )[0];
  if (state?.client_id !== "kawaii") {
    throw new Error("Supabase store identity does not match Kawaii");
  }
  const rows = responseRows(
    await runSql(
      `select
        product.id as product_id,
        product.title,
        variant.id as variant_id,
        variant.color,
        variant.size,
        variant.sku
      from public.products product
      left join public.product_variants variant on variant.product_id = product.id
      order by product.id, variant.id`,
      true,
    ),
  );
  const plan = planSkuBackfill(rows);
  const snapshot = {
    products: Number(state.products),
    variants: Number(state.variants),
    blankSkus: Number(state.blank_skus),
  };
  if (plan.length !== snapshot.blankSkus) {
    throw new Error(
      `SKU plan mismatch: expected ${snapshot.blankSkus}, planned ${plan.length}`,
    );
  }
  const summary = {
    apply: args.apply === true,
    ...snapshot,
    planned: plan.length,
    preserved: snapshot.variants - plan.length,
    samples: plan.slice(0, 10),
  };
  if (args.apply !== true) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  if (plan.length) await runSql(applySql(plan, snapshot));
  const verification = responseRows(
    await runSql(
      `select
        count(*)::int as variants,
        count(*) filter (where nullif(btrim(sku), '') is null)::int as blank_skus,
        count(distinct lower(btrim(sku)))::int as unique_skus
      from public.product_variants`,
      true,
    ),
  )[0];
  if (
    Number(verification?.variants) !== snapshot.variants ||
    Number(verification?.blank_skus) !== 0 ||
    Number(verification?.unique_skus) !== snapshot.variants
  ) {
    throw new Error("Kawaii SKU backfill verification failed");
  }
  console.log(JSON.stringify({ ...summary, verification }, null, 2));
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
