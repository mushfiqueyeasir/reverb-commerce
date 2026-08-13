import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sanitizeHtml from "sanitize-html";
import { createClient } from "@supabase/supabase-js";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import {
  createPlaceholderPng,
  createSupabaseFetch,
  requestJson,
  responseRows,
  sqlLiteral,
} from "./provisioning-core.mjs";
import { csvRows } from "./import-kawaii-products.mjs";

const SUPABASE_API = "https://api.supabase.com";
const MAX_REVIEWS = 20;
const REVIEW_IMAGE_BUCKET = "review-images";
const REVIEW_IMAGE_PREFIX = "kawaii-reviews/v1";
const REVIEW_IMAGE_WIDTH = 900;
const REVIEW_IMAGE_HEIGHT = 1100;

const COMMENTS_HEADER =
  "comment_ID,comment_post_ID,comment_author,comment_author_email,comment_author_url,comment_author_IP,comment_date,comment_date_gmt,comment_content,comment_karma,comment_approved,comment_agent,comment_type,comment_parent,user_id";
const COMMENTMETA_HEADER = "meta_id,comment_id,meta_key,meta_value";

const REVIEW_PALETTES = [
  [255, 245, 248],
  [244, 214, 226],
  [249, 40, 122],
];

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

function wordpressDate(gmtValue, localValue) {
  const source = String(gmtValue ?? localValue ?? "").trim();
  if (!source || source.startsWith("0000-00-00")) return null;
  const parsed = new Date(`${source.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function ratingFrom(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

export async function parseReviewsExport(
  sourcePath,
  input = createReadStream(sourcePath, { encoding: "utf8" }),
) {
  const ratings = new Map();
  const comments = [];
  let table = null;

  for await (const row of csvRows(input)) {
    const joined = row.join(",");
    if (joined === COMMENTMETA_HEADER) {
      table = "commentmeta";
      continue;
    }
    if (joined === COMMENTS_HEADER) {
      table = "comments";
      continue;
    }
    if (table === "commentmeta" && row.length === 4) {
      const [, commentId, key, value] = row;
      if (key === "rating") ratings.set(commentId, value);
      continue;
    }
    if (table === "comments" && row.length === 15) {
      const [
        id,
        postId,
        author,
        ,
        ,
        ,
        date,
        dateGmt,
        content,
        ,
        approved,
        ,
        type,
      ] = row;
      if (type !== "review" || approved !== "1") continue;
      comments.push({
        id,
        postId,
        author: plainText(author),
        content: plainText(content),
        createdAt: wordpressDate(dateGmt, date),
      });
    }
  }
  return { comments, ratings };
}

export function selectReviews(parsed, limit = MAX_REVIEWS) {
  const candidates = parsed.comments
    .map((comment) => ({
      ...comment,
      rating: ratingFrom(parsed.ratings.get(comment.id)),
    }))
    .filter((review) => review.rating !== null);

  return candidates
    .sort((left, right) => {
      if (right.rating !== left.rating) return right.rating - left.rating;
      const leftBody = left.content ? 1 : 0;
      const rightBody = right.content ? 1 : 0;
      if (rightBody !== leftBody) return rightBody - leftBody;
      return String(right.createdAt ?? "").localeCompare(
        String(left.createdAt ?? ""),
      );
    })
    .slice(0, limit)
    .map((review, index) => ({
      ...review,
      image_path: `${REVIEW_IMAGE_PREFIX}/review-${String(index + 1).padStart(2, "0")}.png`,
    }));
}

export function buildReviewRows(reviews) {
  return reviews.map((review) => ({
    customer_name: review.author || null,
    image_path: review.image_path,
    rating: review.rating,
    body: review.content || null,
    product_id: null,
    is_published: true,
    created_at: review.createdAt,
  }));
}

export function reviewInsertSql(reviews) {
  const rows = sqlLiteral(JSON.stringify(reviews));
  return `
begin;
select pg_advisory_xact_lock(hashtext('kawaii-review-import-v1'));
delete from public.reviews
where image_path = 'store-template/v1/reviews/sample-review.png'
   or customer_name like 'SAMPLE REVIEW%';
insert into public.reviews (
  customer_name, image_path, rating, body, product_id, is_published, created_at
)
select
  row.customer_name, row.image_path, row.rating, row.body, row.product_id,
  row.is_published, row.created_at
from jsonb_to_recordset(${rows}::jsonb) as row(
  customer_name text, image_path text, rating int, body text, product_id uuid,
  is_published boolean, created_at timestamptz
);
commit;
`;
}

async function main() {
  const args = parseArguments();
  const sourcePath = resolve(String(args.source ?? ""));
  if (!args.source) throw new Error("--source is required");
  if (!existsSync(sourcePath))
    throw new Error(`CSV export not found: ${sourcePath}`);
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
        (select count(*)::int from public.reviews) as review_count`,
      true,
    ),
  )[0];
  if (state?.client_id !== "kawaii") {
    throw new Error("Supabase store identity does not match Kawaii");
  }

  const parsed = await parseReviewsExport(sourcePath);
  const selected = selectReviews(parsed);
  const rows = buildReviewRows(selected);
  const summary = {
    sourcePath,
    apply: args.apply === true,
    maxReviews: MAX_REVIEWS,
    sourceReviewComments: parsed.comments.length,
    sourceWithRating: [...parsed.ratings.values()].filter((value) =>
      ratingFrom(value),
    ).length,
    selected: selected.length,
    existingReviews: Number(state.review_count),
    imageSize: `${REVIEW_IMAGE_WIDTH}x${REVIEW_IMAGE_HEIGHT}`,
    samples: selected.map((review) => ({
      name: review.author,
      rating: review.rating,
      body: review.content?.slice(0, 90) ?? null,
    })),
  };

  if (args.apply !== true) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const imagePaths = await uploadReviewImages(
    token,
    manifest.supabase.projectRef,
    selected,
  );
  if (imagePaths.length !== selected.length) {
    throw new Error("Review image upload count mismatch");
  }

  await runSql(reviewInsertSql(rows));
  const verification = responseRows(
    await runSql(
      `select
        (select count(*)::int from public.reviews where is_published) as published,
        (select count(*)::int from public.reviews where image_path is not null) as with_image`,
      true,
    ),
  )[0];
  console.log(
    JSON.stringify({ ...summary, imagePaths, verification }, null, 2),
  );
}

async function uploadReviewImages(token, projectRef, reviews) {
  const keyResponse = await requestJson(
    `${SUPABASE_API}/v1/projects/${projectRef}/api-keys`,
    { token },
  );
  const keys = Array.isArray(keyResponse)
    ? keyResponse
    : (keyResponse?.keys ?? []);
  const serviceRole = keys.find(
    (key) => key.type === "legacy" && key.name === "service_role",
  )?.api_key;
  if (!serviceRole) throw new Error("Kawaii service-role key is unavailable");

  const supabase = createClient(
    `https://${projectRef}.supabase.co`,
    serviceRole,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: createSupabaseFetch(serviceRole) },
    },
  );

  const paths = [];
  for (const [index, review] of reviews.entries()) {
    const path = `${REVIEW_IMAGE_PREFIX}/review-${String(index + 1).padStart(2, "0")}.png`;
    const content = createPlaceholderPng(
      REVIEW_IMAGE_WIDTH,
      REVIEW_IMAGE_HEIGHT,
      REVIEW_PALETTES,
    );
    const { error } = await supabase.storage
      .from(REVIEW_IMAGE_BUCKET)
      .upload(path, content, {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: true,
      });
    if (error) throw new Error(`Failed to upload ${path}: ${error.message}`);
    paths.push(path);
  }
  return paths;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
