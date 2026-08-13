import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sanitizeHtml from "sanitize-html";
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
const META_KEYS = new Set([
  "_manage_stock",
  "_price",
  "_product_image_gallery",
  "_regular_price",
  "_sale_price",
  "_sku",
  "_stock",
  "_stock_status",
  "_thumbnail_id",
]);
const TABLE_HEADERS = new Map([
  ["meta_id,post_id,meta_key,meta_value", "postmeta"],
  [
    "ID,post_author,post_date,post_date_gmt,post_content,post_title,post_excerpt,post_status,comment_status,ping_status,post_password,post_name,to_ping,pinged,post_modified,post_modified_gmt,post_content_filtered,post_parent,guid,menu_order,post_type,post_mime_type,comment_count",
    "posts",
  ],
  ["term_id,name,slug,term_group,term_order", "terms"],
  ["object_id,term_taxonomy_id,term_order", "term_relationships"],
  [
    "term_taxonomy_id,term_id,taxonomy,description,parent,count",
    "term_taxonomy",
  ],
  [
    "product_id,sku,virtual,downloadable,min_price,max_price,onsale,stock_quantity,stock_status,rating_count,average_rating,total_sales,tax_status,tax_class,global_unique_id",
    "product_lookup",
  ],
]);
const CATEGORY_MAPPING = new Map(
  Object.entries({
    "bath-and-body": ["bath-personal-care"],
    "body-lotion": ["body-care"],
    "body-soap": ["soap"],
    cleansers: ["cleansers"],
    "daiso-haul": [],
    "eye-care": ["eye-care"],
    eyes: ["makeup"],
    face: ["makeup"],
    "face-wash": ["face-wash"],
    "facial-care": ["skincare"],
    "green-tea": ["green-tea"],
    "hair-mask": ["hair-treatment"],
    "hair-oil-and-serum": ["hair-oil-serum"],
    "hair-tonic": ["hair-treatment"],
    "hand-cream": ["hand-foot-care"],
    "health-andfitness": ["health-supplements"],
    lip: ["lip-care"],
    "lip-care": ["lip-care"],
    "lotion-and-toner": ["toners-lotions"],
    makeup: ["makeup"],
    "mens-care": ["mens-skincare"],
    moisturiser: ["moisturizers-creams"],
    "scalp-and-hair": ["hair-care"],
    "scru-and-exfoliator": ["skincare"],
    "serum-and-essence": ["serums-essences"],
    "shampoo-and-conditioner": ["hair-care"],
    "sheet-mask": ["face-masks"],
    "skin-conditioner": ["toners-lotions"],
    "skin-milk": ["moisturizers-creams"],
    "spf-powder": ["powder", "sunscreens"],
    "supplements-and-vitamin": ["health-supplements"],
    sunscreen: ["sunscreens"],
    uncategorized: [],
    "uv-essence": ["sunscreens"],
    "uv-gel": ["sunscreens"],
    "uv-milk": ["sunscreens"],
    "uv-spray": ["sunscreens"],
    "women-hygiene": ["feminine-care"],
    "wrinkle-care": ["anti-aging-care"],
  }),
);

export async function* csvRows(input) {
  let row = [];
  let field = "";
  let inQuotes = false;
  let quotePending = false;
  let skipLineFeed = false;

  const finishField = () => {
    row.push(field);
    field = "";
  };

  for await (const chunk of input) {
    for (const character of chunk) {
      if (skipLineFeed) {
        skipLineFeed = false;
        if (character === "\n") continue;
      }
      if (inQuotes) {
        if (quotePending) {
          if (character === '"') {
            field += '"';
            quotePending = false;
            continue;
          }
          inQuotes = false;
          quotePending = false;
        } else if (character === '"') {
          quotePending = true;
          continue;
        } else {
          field += character;
          continue;
        }
      }
      if (character === '"' && field.length === 0) {
        inQuotes = true;
      } else if (character === ",") {
        finishField();
      } else if (character === "\n" || character === "\r") {
        finishField();
        yield row;
        row = [];
        if (character === "\r") skipLineFeed = true;
      } else {
        field += character;
      }
    }
  }
  if (quotePending) inQuotes = false;
  if (inQuotes) throw new Error("CSV ended inside a quoted field");
  if (field.length > 0 || row.length > 0) {
    finishField();
    yield row;
  }
}

function isHeader(row) {
  return (
    row.length > 1 &&
    row.every((value) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value))
  );
}

export async function parseWordPressExport(sourcePath) {
  const metadata = new Map();
  const posts = new Map();
  const attachments = new Map();
  const terms = new Map();
  const relationships = [];
  const taxonomies = new Map();
  const lookups = new Map();
  let currentTable = null;

  const input = createReadStream(sourcePath, { encoding: "utf8" });
  for await (const row of csvRows(input)) {
    if (isHeader(row)) {
      currentTable = TABLE_HEADERS.get(row.join(",")) ?? null;
      continue;
    }
    if (currentTable === "postmeta" && row.length === 4) {
      const [, postId, key, value] = row;
      if (!META_KEYS.has(key)) continue;
      const values = metadata.get(postId) ?? {};
      values[key] = value;
      metadata.set(postId, values);
    } else if (currentTable === "posts" && row.length === 23) {
      const [
        id,
        ,
        postDate,
        postDateGmt,
        content,
        title,
        excerpt,
        status,
        ,
        ,
        ,
        slug,
        ,
        ,
        modified,
        modifiedGmt,
        ,
        parent,
        guid,
        menuOrder,
        type,
        mimeType,
      ] = row;
      const post = {
        id,
        postDate,
        postDateGmt,
        content,
        title,
        excerpt,
        status,
        slug,
        modified,
        modifiedGmt,
        parent,
        guid,
        menuOrder,
        type,
        mimeType,
      };
      if (type === "product") posts.set(id, post);
      if (type === "attachment") attachments.set(id, post);
    } else if (currentTable === "terms" && row.length === 5) {
      terms.set(row[0], { id: row[0], name: row[1], slug: row[2] });
    } else if (currentTable === "term_relationships" && row.length === 3) {
      relationships.push({ objectId: row[0], taxonomyId: row[1] });
    } else if (currentTable === "term_taxonomy" && row.length === 6) {
      taxonomies.set(row[0], {
        id: row[0],
        termId: row[1],
        taxonomy: row[2],
      });
    } else if (currentTable === "product_lookup" && row.length === 15) {
      lookups.set(row[0], {
        sku: row[1],
        minPrice: row[4],
        maxPrice: row[5],
        stock: row[7],
        stockStatus: row[8],
      });
    }
  }

  return {
    metadata,
    posts,
    attachments,
    terms,
    relationships,
    taxonomies,
    lookups,
  };
}

export function deterministicUuid(value) {
  const bytes = createHash("sha256").update(`kawaii:${value}`).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function plainText(value) {
  return decodeHtml(
    sanitizeHtml(String(value ?? ""), {
      allowedTags: [],
      allowedAttributes: {},
    }),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function productHtml(value) {
  return sanitizeHtml(String(value ?? "").replaceAll("\0", ""), {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "article",
      "div",
      "figure",
      "figcaption",
      "h1",
      "h2",
      "img",
      "picture",
      "section",
      "source",
      "span",
    ],
    allowedAttributes: {
      "*": ["class", "id", "role", "aria-label", "aria-hidden"],
      a: ["href", "name", "target", "rel", "title", "class"],
      img: [
        "src",
        "srcset",
        "sizes",
        "alt",
        "title",
        "width",
        "height",
        "loading",
        "decoding",
        "class",
      ],
      source: ["src", "srcset", "sizes", "type", "media"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
  }).trim();
}

function valueOrNull(value) {
  const normalized = String(value ?? "").trim();
  return normalized && normalized !== "NULL" ? normalized : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const normalized = valueOrNull(value);
    if (normalized === null) continue;
    const number = Number(normalized);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function wordpressDate(gmtValue, localValue) {
  const source = valueOrNull(gmtValue) ?? valueOrNull(localValue);
  if (!source || source.startsWith("0000-00-00")) return new Date().toISOString();
  const parsed = new Date(`${source.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.valueOf()) ? new Date().toISOString() : parsed.toISOString();
}

function imageUrl(value) {
  const normalized = valueOrNull(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function uniqueProductSlug(post, title, seenSlugs) {
  const generated = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = String(post.slug ?? "").trim() || generated || "product";
  let slug = base;
  if (seenSlugs.has(slug)) slug = `${base}-${post.id}`;
  let suffix = 2;
  while (seenSlugs.has(slug)) {
    slug = `${base}-${post.id}-${suffix}`;
    suffix += 1;
  }
  seenSlugs.add(slug);
  return slug;
}

function sourceCategories(parsed) {
  const result = new Map();
  for (const relationship of parsed.relationships) {
    if (!parsed.posts.has(relationship.objectId)) continue;
    const taxonomy = parsed.taxonomies.get(relationship.taxonomyId);
    if (taxonomy?.taxonomy !== "product_cat") continue;
    const term = parsed.terms.get(taxonomy.termId);
    if (!term) continue;
    const categories = result.get(relationship.objectId) ?? new Set();
    categories.add(term.slug);
    result.set(relationship.objectId, categories);
  }
  return result;
}

export function buildCatalog(parsed, categoryRows, includeDrafts = true) {
  const categoryBySlug = new Map(
    categoryRows.map((category) => [category.slug, category.id]),
  );
  const defaultCategory = categoryRows.find((category) => category.is_default);
  if (!defaultCategory) throw new Error("Kawaii default category is missing");
  const missingTargetCategories = new Set();
  for (const targetSlugs of CATEGORY_MAPPING.values()) {
    for (const slug of targetSlugs) {
      if (!categoryBySlug.has(slug)) missingTargetCategories.add(slug);
    }
  }
  if (missingTargetCategories.size > 0) {
    throw new Error(
      `Kawaii target categories are missing: ${[...missingTargetCategories].sort().join(", ")}`,
    );
  }

  const categoriesByProduct = sourceCategories(parsed);
  const unmappedSourceCategories = new Set();
  const products = [];
  const variants = [];
  const images = [];
  const productCategories = [];
  const seenSlugs = new Set();
  const seenSkus = new Set();
  let omittedImages = 0;

  const sourceProducts = [...parsed.posts.values()]
    .filter(
      (post) =>
        post.status === "publish" || (includeDrafts && post.status === "draft"),
    )
    .sort((left, right) =>
      wordpressDate(left.postDateGmt, left.postDate).localeCompare(
        wordpressDate(right.postDateGmt, right.postDate),
      ),
    );

  for (const [index, post] of sourceProducts.entries()) {
    const id = deterministicUuid(`product:${post.id}`);
    const meta = parsed.metadata.get(post.id) ?? {};
    const lookup = parsed.lookups.get(post.id) ?? {};
    const currentPrice = firstNumber(meta._price, lookup.minPrice, meta._regular_price);
    const originalPrice = firstNumber(meta._regular_price, currentPrice);
    const createdAt = wordpressDate(post.postDateGmt, post.postDate);
    const updatedAt = wordpressDate(post.modifiedGmt, post.modified);
    const content = productHtml(post.content || post.excerpt);
    const title = plainText(post.title) || `Product ${post.id}`;
    const slug = uniqueProductSlug(post, title, seenSlugs);
    products.push({
      id,
      title,
      slug,
      original_price: Math.max(0, originalPrice),
      current_price: Math.max(0, currentPrice),
      description: { html: content },
      status: post.status === "publish" ? "active" : "draft",
      product_type: "simple",
      sizing_mode: "none",
      sort: (index + 1) * 10,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    const rawSku = valueOrNull(meta._sku) ?? valueOrNull(lookup.sku);
    const sku = rawSku && !seenSkus.has(rawSku.toLowerCase()) ? rawSku : null;
    if (sku) seenSkus.add(sku.toLowerCase());
    variants.push({
      id: deterministicUuid(`variant:${post.id}`),
      product_id: id,
      size: null,
      color: null,
      sku,
      price_override: null,
      stock_quantity: Math.max(
        0,
        Math.trunc(firstNumber(meta._stock, lookup.stock)),
      ),
      low_stock_threshold: 5,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    const imageIds = [
      valueOrNull(meta._thumbnail_id),
      ...(valueOrNull(meta._product_image_gallery)?.split(",") ?? []),
    ].filter(Boolean);
    const uniqueImageIds = [...new Set(imageIds)];
    if (uniqueImageIds.length > 5) omittedImages += uniqueImageIds.length - 5;
    for (const [imageIndex, attachmentId] of uniqueImageIds.slice(0, 5).entries()) {
      const path = imageUrl(parsed.attachments.get(attachmentId)?.guid);
      if (!path) continue;
      images.push({
        id: deterministicUuid(`image:${post.id}:${attachmentId}`),
        product_id: id,
        path,
        alt: title,
        is_main: imageIndex === 0,
        sort: imageIndex,
        created_at: createdAt,
      });
    }

    const targetCategoryIds = new Set([defaultCategory.id]);
    for (const sourceSlug of categoriesByProduct.get(post.id) ?? []) {
      const targetSlugs = CATEGORY_MAPPING.get(sourceSlug);
      if (!targetSlugs) {
        unmappedSourceCategories.add(sourceSlug);
        continue;
      }
      for (const targetSlug of targetSlugs) {
        targetCategoryIds.add(categoryBySlug.get(targetSlug));
      }
    }
    for (const categoryId of targetCategoryIds) {
      productCategories.push({ product_id: id, category_id: categoryId });
    }
  }

  return {
    products,
    variants,
    images,
    productCategories,
    unmappedSourceCategories: [...unmappedSourceCategories].sort(),
    omittedImages,
  };
}

function insertSql(catalog) {
  const products = sqlLiteral(JSON.stringify(catalog.products));
  const variants = sqlLiteral(JSON.stringify(catalog.variants));
  const images = sqlLiteral(JSON.stringify(catalog.images));
  const productCategories = sqlLiteral(
    JSON.stringify(catalog.productCategories),
  );
  return `
begin;
select pg_advisory_xact_lock(hashtext('kawaii-product-import-v1'));
do $$
begin
  if exists(select 1 from public.products) then
    raise exception 'Kawaii already has products; refusing to import';
  end if;
end;
$$;
insert into public.products (
  id, title, slug, original_price, current_price, description, status,
  product_type, sizing_mode, sort, created_at, updated_at
)
select
  row.id, row.title, row.slug, row.original_price, row.current_price,
  row.description, row.status, row.product_type, row.sizing_mode, row.sort,
  row.created_at, row.updated_at
from jsonb_to_recordset(${products}::jsonb) as row(
  id uuid, title text, slug text, original_price numeric, current_price numeric,
  description jsonb, status text, product_type text, sizing_mode text, sort int,
  created_at timestamptz, updated_at timestamptz
);
insert into public.product_variants (
  id, product_id, size, color, sku, price_override, stock_quantity,
  low_stock_threshold, created_at, updated_at
)
select
  row.id, row.product_id, row.size, row.color, row.sku, row.price_override,
  row.stock_quantity, row.low_stock_threshold, row.created_at, row.updated_at
from jsonb_to_recordset(${variants}::jsonb) as row(
  id uuid, product_id uuid, size text, color text, sku text,
  price_override numeric, stock_quantity int, low_stock_threshold int,
  created_at timestamptz, updated_at timestamptz
);
insert into public.product_images (
  id, product_id, path, alt, is_main, sort, created_at
)
select
  row.id, row.product_id, row.path, row.alt, row.is_main, row.sort,
  row.created_at
from jsonb_to_recordset(${images}::jsonb) as row(
  id uuid, product_id uuid, path text, alt text, is_main boolean, sort int,
  created_at timestamptz
);
insert into public.product_categories (product_id, category_id)
select row.product_id, row.category_id
from jsonb_to_recordset(${productCategories}::jsonb) as row(
  product_id uuid, category_id uuid
);
commit;
`;
}

async function main() {
  const args = parseArguments();
  const sourcePath = resolve(String(args.source ?? ""));
  if (!args.source) throw new Error("--source is required");
  if (!existsSync(sourcePath)) throw new Error(`CSV export not found: ${sourcePath}`);
  const includeDrafts = args["published-only"] !== true;
  const { manifest } = loadClient("kawaii");
  const secrets = parseEnvFile(
    resolve(repositoryRoot, ".client-secrets", "kawaii.env"),
  );
  const token = secrets.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is missing");

  const runSql = (query, readOnly = false) =>
    requestJson(
      `${SUPABASE_API}/v1/projects/${manifest.supabase.projectRef}/database/query`,
      {
        token,
        method: "POST",
        body: { query, read_only: readOnly },
        expected: [201],
      },
    );
  const state = responseRows(
    await runSql(
      `select
        (select client_id from provisioning.store_identity where singleton = true) as client_id,
        (select count(*)::int from public.products) as product_count`,
      true,
    ),
  )[0];
  if (state?.client_id !== "kawaii") {
    throw new Error("Supabase store identity does not match Kawaii");
  }
  const categoryRows = responseRows(
    await runSql(
      "select id, slug, is_default from public.categories order by sort, slug",
      true,
    ),
  );
  const parsed = await parseWordPressExport(sourcePath);
  const catalog = buildCatalog(parsed, categoryRows, includeDrafts);
  const expectedActive = catalog.products.filter(
    (product) => product.status === "active",
  ).length;
  const expectedDraft = catalog.products.length - expectedActive;
  const summary = {
    sourcePath,
    apply: args.apply === true,
    products: catalog.products.length,
    active: expectedActive,
    drafts: expectedDraft,
    variants: catalog.variants.length,
    images: catalog.images.length,
    categoryLinks: catalog.productCategories.length,
    omittedImages: catalog.omittedImages,
    unmappedSourceCategories: catalog.unmappedSourceCategories,
    existingProducts: Number(state.product_count),
  };

  if (args.apply !== true) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  if (Number(state.product_count) !== 0) {
    throw new Error("Kawaii already has products; refusing to import");
  }
  await runSql(insertSql(catalog));
  const verification = responseRows(
    await runSql(
      `select
        (select count(*)::int from public.products) as products,
        (select count(*)::int from public.products where status = 'active') as active,
        (select count(*)::int from public.products where status = 'draft') as drafts,
        (select count(*)::int from public.product_variants) as variants,
        (select count(*)::int from public.product_images) as images,
        (select count(*)::int from public.product_categories) as category_links`,
      true,
    ),
  )[0];
  const expected = {
    products: catalog.products.length,
    active: expectedActive,
    drafts: expectedDraft,
    variants: catalog.variants.length,
    images: catalog.images.length,
    category_links: catalog.productCategories.length,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (Number(verification?.[key]) !== value) {
      throw new Error(
        `Kawaii product import verification failed for ${key}: expected ${value}, received ${verification?.[key]}`,
      );
    }
  }
  console.log(JSON.stringify({ ...summary, verification }, null, 2));
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
