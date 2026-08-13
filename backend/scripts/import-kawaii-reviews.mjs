import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import {
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

// Curated royalty-free (Unsplash) photos matched to each review's topic, since
// reviews are product-independent. A keyword derived from the review body picks
// the closest image, with a per-slot fallback so all 20 tiles stay relevant and
// varied instead of one flat placeholder block.
const REVIEW_IMAGE_BY_KEYWORD = {
  acne: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&h=1100&q=80",
  moisturizer:
    "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=900&h=1100&q=80",
  toner:
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&h=1100&q=80",
  retinol:
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&h=1100&q=80",
  cleanser:
    "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=900&h=1100&q=80",
  shampoo:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&h=1100&q=80",
  conditioner:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&h=1100&q=80",
  hair: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&h=1100&q=80",
  sunscreen:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&h=1100&q=80",
  makeup:
    "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=900&h=1100&q=80",
  serum:
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&h=1100&q=80",
  hydrating:
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&h=1100&q=80",
  emulsion:
    "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=900&h=1100&q=80",
};

// Fallback pool used when no keyword matches; slot index selects deterministically.
const REVIEW_IMAGE_FALLBACKS = [
  "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?auto=format&fit=crop&w=900&h=1100&q=80",
  "https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=900&h=1100&q=80",
];

export function reviewImageFor(body, index) {
  const haystack = String(body ?? "").toLowerCase();
  for (const [keyword, url] of Object.entries(REVIEW_IMAGE_BY_KEYWORD)) {
    if (haystack.includes(keyword)) return url;
  }
  return REVIEW_IMAGE_FALLBACKS[index % REVIEW_IMAGE_FALLBACKS.length];
}

const COMMENTS_HEADER =
  "comment_ID,comment_post_ID,comment_author,comment_author_email,comment_author_url,comment_author_IP,comment_date,comment_date_gmt,comment_content,comment_karma,comment_approved,comment_agent,comment_type,comment_parent,user_id";
const COMMENTMETA_HEADER = "meta_id,comment_id,meta_key,meta_value";

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
    const sourceUrl = reviewImageFor(review.content, index);
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch review image ${sourceUrl}: ${response.status}`,
      );
    }
    const content = Buffer.from(await response.arrayBuffer());
    const contentType =
      response.headers.get("content-type")?.split(";")[0].trim() ||
      "image/jpeg";
    const pngContent = await sharp(content).png().toBuffer();
    const { error } = await supabase.storage
      .from(REVIEW_IMAGE_BUCKET)
      .upload(path, pngContent, {
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
