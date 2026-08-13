import { join } from "node:path";
import {
  loadClient,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import {
  requestJson,
  responseRows,
  sqlLiteral,
} from "./provisioning-core.mjs";

const SUPABASE_API = "https://api.supabase.com";
const CATEGORY_IMAGES = {
  skincare:
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
  makeup:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80",
  "hair-care":
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
  "bath-personal-care":
    "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1200&q=80",
  "health-supplements":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
  "baby-kids":
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1200&q=80",
  "by-skin-concern":
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
  "by-skin-type":
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=80",
};
const categories = [
  ["Skincare", "skincare", null],
  ["Cleansers", "cleansers", "skincare"],
  ["Face Wash", "face-wash", "skincare"],
  ["Makeup Removers", "makeup-removers", "skincare"],
  ["Toners & Lotions", "toners-lotions", "skincare"],
  ["Serums & Essences", "serums-essences", "skincare"],
  ["Moisturizers & Creams", "moisturizers-creams", "skincare"],
  ["Sunscreens", "sunscreens", "skincare"],
  ["Face Masks", "face-masks", "skincare"],
  ["Eye Care", "eye-care", "skincare"],
  ["Lip Care", "lip-care", "skincare"],
  ["Acne Care", "acne-care", "skincare"],
  ["Whitening & Brightening", "whitening-brightening", "skincare"],
  ["Anti-Aging Care", "anti-aging-care", "skincare"],
  ["Men’s Skincare", "mens-skincare", "skincare"],
  ["Body Care", "body-care", "skincare"],
  ["Hand & Foot Care", "hand-foot-care", "skincare"],
  ["Makeup", "makeup", null],
  ["Primer", "primer", "makeup"],
  ["Foundation", "foundation", "makeup"],
  ["Cushion Foundation", "cushion-foundation", "makeup"],
  ["Concealer", "concealer", "makeup"],
  ["Powder", "powder", "makeup"],
  ["Blush", "blush", "makeup"],
  ["Eyeshadow", "eyeshadow", "makeup"],
  ["Eyeliner", "eyeliner", "makeup"],
  ["Mascara", "mascara", "makeup"],
  ["Lipstick & Tint", "lipstick-tint", "makeup"],
  ["Makeup Remover", "makeup-remover", "makeup"],
  ["Hair Care", "hair-care", null],
  ["Shampoo", "shampoo", "hair-care"],
  ["Conditioner", "conditioner", "hair-care"],
  ["Hair Treatment", "hair-treatment", "hair-care"],
  ["Hair Oil & Serum", "hair-oil-serum", "hair-care"],
  ["Hair Styling", "hair-styling", "hair-care"],
  ["Hair Color", "hair-color", "hair-care"],
  ["Bath & Personal Care", "bath-personal-care", null],
  ["Body Wash", "body-wash", "bath-personal-care"],
  ["Soap", "soap", "bath-personal-care"],
  ["Bath Salts", "bath-salts", "bath-personal-care"],
  ["Deodorants", "deodorants", "bath-personal-care"],
  ["Feminine Care", "feminine-care", "bath-personal-care"],
  ["Oral Care", "oral-care", "bath-personal-care"],
  ["Health & Supplements", "health-supplements", null],
  ["Collagen Supplements", "collagen-supplements", "health-supplements"],
  ["Vitamins", "vitamins", "health-supplements"],
  ["Beauty Supplements", "beauty-supplements", "health-supplements"],
  ["Weight Management", "weight-management", "health-supplements"],
  ["Probiotics", "probiotics", "health-supplements"],
  ["Green Tea", "green-tea", "health-supplements"],
  ["Coffee", "coffee", "health-supplements"],
  ["Baby & Kids", "baby-kids", null],
  ["Baby Lotion", "baby-lotion", "baby-kids"],
  ["Baby Wash", "baby-wash", "baby-kids"],
  ["Baby Sunscreen", "baby-sunscreen", "baby-kids"],
  ["Baby Care Accessories", "baby-care-accessories", "baby-kids"],
  ["By Skin Concern", "by-skin-concern", null],
  ["Acne & Pimples", "acne-pimples", "by-skin-concern"],
  ["Dry Skin", "dry-skin-concern", "by-skin-concern"],
  ["Sensitive Skin", "sensitive-skin-concern", "by-skin-concern"],
  ["Oily Skin", "oily-skin-concern", "by-skin-concern"],
  ["Dark Spots", "dark-spots", "by-skin-concern"],
  ["Dullness", "dullness", "by-skin-concern"],
  ["Pores", "pores", "by-skin-concern"],
  ["Wrinkles & Fine Lines", "wrinkles-fine-lines", "by-skin-concern"],
  ["Redness", "redness", "by-skin-concern"],
  ["Sun Damage", "sun-damage", "by-skin-concern"],
  ["By Skin Type", "by-skin-type", null],
  ["Normal Skin", "normal-skin", "by-skin-type"],
  ["Dry Skin", "dry-skin-type", "by-skin-type"],
  ["Oily Skin", "oily-skin-type", "by-skin-type"],
  ["Combination Skin", "combination-skin", "by-skin-type"],
  ["Sensitive Skin", "sensitive-skin-type", "by-skin-type"],
  ["All Skin Types", "all-skin-types", "by-skin-type"],
  [
    "All Skin Types Except Sensitive Skin",
    "all-skin-types-except-sensitive-skin",
    "by-skin-type",
  ],
].map(([name, slug, parentSlug]) => ({
  name,
  slug,
  parentSlug,
  imageUrl: CATEGORY_IMAGES[parentSlug ?? slug],
}));
const expectedSubcategoryCount = categories.filter(
  (category) => category.parentSlug,
).length;

const { manifest } = loadClient("kawaii");
const secretPath = join(repositoryRoot, ".client-secrets", "kawaii.env");
const secrets = parseEnvFile(secretPath);
const token = secrets.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) throw new Error(`SUPABASE_ACCESS_TOKEN is missing in ${secretPath}`);

async function runSql(query, readOnly = false) {
  return requestJson(
    `${SUPABASE_API}/v1/projects/${manifest.supabase.projectRef}/database/query`,
    {
      token,
      method: "POST",
      body: { query, read_only: readOnly },
      expected: [201],
    },
  );
}

const identity = responseRows(
  await runSql(
    "select client_id from provisioning.store_identity where singleton = true",
    true,
  ),
)[0];
if (identity?.client_id !== "kawaii") {
  throw new Error("Supabase store identity does not match Kawaii");
}

const state = responseRows(
  await runSql(
    `select
      exists(
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'categories'
          and column_name = 'parent_id'
      ) as hierarchy_ready,
      (select count(*)::int from public.products) as product_count`,
    true,
  ),
)[0];
if (!state?.hierarchy_ready) {
  throw new Error("Category hierarchy migration is not applied");
}
if (Number(state.product_count) > 0) {
  throw new Error("Kawaii has products; refusing to replace category assignments");
}

const rootRows = categories
  .filter((category) => !category.parentSlug)
  .map(
    (category, index) =>
      `(${sqlLiteral(category.name)}, ${sqlLiteral(category.slug)}, null, null, ${sqlLiteral(category.imageUrl)}, ${(index + 1) * 10}, false)`,
  )
  .join(",\n");
const siblingPositions = new Map();
const childRows = categories
  .filter((category) => category.parentSlug)
  .map((category) => {
    const position = (siblingPositions.get(category.parentSlug) ?? 0) + 1;
    siblingPositions.set(category.parentSlug, position);
    return `(${sqlLiteral(category.name)}, ${sqlLiteral(category.slug)}, ${sqlLiteral(category.parentSlug)}, ${sqlLiteral(category.imageUrl)}, ${position * 10})`;
  })
  .join(",\n");

await runSql(`
begin;
select pg_advisory_xact_lock(hashtext('kawaii-category-import-v1'));
lock table public.products in share mode;
do $$
begin
  if exists(select 1 from public.products) then
    raise exception 'Kawaii has products; refusing to replace category assignments';
  end if;
end;
$$;
delete from public.product_categories
where category_id in (select id from public.categories where not is_default);
delete from public.categories where not is_default and parent_id is not null;
delete from public.categories where not is_default;
insert into public.categories (name, slug, parent_id, description, image_path, sort, is_default)
values
${rootRows};
with child_values (name, slug, parent_slug, image_url, sort) as (
  values
${childRows}
)
insert into public.categories (name, slug, parent_id, description, image_path, sort, is_default)
select child.name, child.slug, parent.id, null, child.image_url, child.sort, false
from child_values child
join public.categories parent on parent.slug = child.parent_slug;
do $$
declare
  imported_count integer;
  imported_subcategory_count integer;
begin
  select
    count(*)::int,
    count(*) filter (where parent_id is not null)::int
  into imported_count, imported_subcategory_count
  from public.categories
  where not is_default;

  if imported_count <> ${categories.length} then
    raise exception 'Expected ${categories.length} categories, found %', imported_count;
  end if;
  if imported_subcategory_count <> ${expectedSubcategoryCount} then
    raise exception 'Expected ${expectedSubcategoryCount} subcategories, found %', imported_subcategory_count;
  end if;
end;
$$;
commit;
`);

const imported = responseRows(
  await runSql(
    `select count(*)::int as category_count,
      count(*) filter (where parent_id is not null)::int as subcategory_count
    from public.categories
    where not is_default`,
    true,
  ),
)[0];
if (
  Number(imported?.category_count) !== categories.length ||
  Number(imported?.subcategory_count) !== expectedSubcategoryCount
) {
  throw new Error("Kawaii category import verification failed");
}

console.log(
  JSON.stringify({
    clientId: manifest.id,
    projectRef: manifest.supabase.projectRef,
    categoryCount: Number(imported.category_count),
    subcategoryCount: Number(imported.subcategory_count),
  }),
);
