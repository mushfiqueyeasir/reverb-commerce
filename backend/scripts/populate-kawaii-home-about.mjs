import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import {
  createSupabaseFetch,
  maskSecret,
  requestJson,
  responseRows,
  sqlLiteral,
} from "./provisioning-core.mjs";

const SUPABASE_API = "https://api.supabase.com";
export const KAWAII_CLIENT_ID = "kawaii";
export const KAWAII_PROJECT_REF = "dpgzrukkmoyvrzubaenx";
export const FACEBOOK_URL = "https://www.facebook.com/kawaiicosmeticsbd";
export const FACEBOOK_PROFILE_PATH = "kawaii-content/v2/facebook-profile.jpg";
export const STORY_CLASSIC_PATH = "kawaii-content/v2/story-classic.webp";
export const STORY_EDITORIAL_PATH = "kawaii-content/v2/story-editorial.webp";
export const MIGRATION_KEY = "kawaii-home-about-v2";
export const TEMPLATE_PROMOTION_ID = "70000000-0000-4000-8000-000000000001";
export const CATEGORY_IDS = [
  "0987e8ee-906f-4602-9a00-acd4c7bf8d99",
  "5469167b-24c1-4316-b135-e9213e5c75e1",
  "42fda0a5-9bfb-47b2-8c18-9dd467b28ade",
  "c3ad32eb-5717-4edf-91e5-6ca96ee6cdc2",
];
export const HOMEPAGE_TYPES = [
  "banner",
  "categories",
  "featured",
  "reviews",
  "promo",
  "richtext",
  "banner_v2",
  "categories_v2",
  "featured_v2",
  "reviews_v2",
  "promo_v2",
  "richtext_v2",
];
export const ABOUT_TYPES = [
  "hero",
  "stats",
  "story",
  "values",
  "craft",
  "cta",
  "hero_v2",
  "stats_v2",
  "story_v2",
  "values_v2",
  "craft_v2",
  "cta_v2",
];
export const BANNER_PATHS = [1, 2, 3].map(
  (number) => `kawaii-content/v1/banner-${number}.webp`,
);
const EPOCH = "1970-01-01T00:00:00.000Z";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function homepageRow(id, type, title, subtitle, body, sort, config) {
  return {
    id,
    type,
    title,
    subtitle,
    body,
    sort,
    active: true,
    config,
    created_at: EPOCH,
    updated_at: EPOCH,
  };
}

function aboutRow(id, type, title, sort, config) {
  return {
    id,
    type,
    title,
    sort,
    active: true,
    config,
    created_at: EPOCH,
    updated_at: EPOCH,
  };
}

export function buildHomepageSections() {
  return [
    homepageRow(
      "60000000-0000-4000-8000-000000000001",
      "banner",
      null,
      null,
      null,
      0,
      {
        description:
          "Kawaii is a Dhaka-based Facebook destination for authentic Japanese cosmetics and everyday skincare in Bangladesh.",
        show_marquee: true,
        stats: [
          { label: "Facebook likes", value: "88K+" },
          { label: "Public snapshot", value: "143 talking" },
          { label: "Based in", value: "Dhaka" },
          { label: "Destination", value: "Everyday skincare" },
        ],
        marquee_items: [
          "AUTHENTIC JAPANESE COSMETICS",
          "EVERYDAY SKINCARE",
          "DHAKA, BANGLADESH",
          "KAWAII BEAUTY",
        ],
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000002",
      "categories",
      "Shop Japanese Beauty by Category",
      "Explore Kawaii's skincare and cosmetics selection",
      null,
      1,
      {
        eyebrow: "Find your routine",
        category_ids: [...CATEGORY_IDS],
        cta_label: "View all products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000003",
      "featured",
      "Featured Kawaii Picks",
      "Japanese cosmetics selected for everyday routines",
      null,
      2,
      {
        eyebrow: "Kawaii collection",
        limit: 4,
        cta_label: "View all products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000005",
      "reviews",
      "From a Kawaii Customer",
      "Published feedback from the Kawaii community",
      null,
      3,
      {
        eyebrow: "Customer review",
        limit: 1,
        cta_label: "Read reviews",
        cta_url: "/reviews",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000004",
      "promo",
      "Discover the Featured Collection",
      "Everyday Japanese skincare and cosmetics from Kawaii",
      null,
      4,
      {
        promotion_id: TEMPLATE_PROMOTION_ID,
        cta_label: "Explore the collection",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000006",
      "richtext",
      "Your Everyday Japanese Skincare Destination",
      "Kawaii in Dhaka",
      "<p>Kawaii is a Dhaka Facebook page and an authentic Japanese cosmetics seller serving beauty shoppers in Bangladesh. Follow the page for product updates and explore skincare for everyday routines.</p>",
      5,
      {
        image_path: STORY_CLASSIC_PATH,
        image_bucket: "branding",
        layout: "feature",
        eyebrow: "About Kawaii",
        cta_label: "Visit Kawaii on Facebook",
        cta_url: FACEBOOK_URL,
        image_alt: "Japanese skincare presented by Kawaii",
        image_label: "Kawaii beauty",
        image_value: "Everyday skincare",
        image_tag: "// JAPAN",
        copy_label: "Kawaii story",
        cards_label: "Public page snapshot",
        cards: [
          {
            id: "facebook-likes",
            icon: "sparkles",
            label: "88K+ likes",
            detail: "Public Facebook snapshot",
          },
          {
            id: "facebook-talking",
            icon: "zap",
            label: "143 talking",
            detail: "Public Facebook snapshot",
          },
        ],
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000007",
      "banner_v2",
      null,
      null,
      null,
      6,
      {
        description:
          "Meet Kawaii's authentic Japanese cosmetics and everyday skincare collection in Bangladesh.",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000008",
      "categories_v2",
      "Explore the Kawaii Collection",
      "Four ways to begin an everyday beauty routine",
      null,
      7,
      {
        eyebrow: "Japanese beauty",
        category_ids: [...CATEGORY_IDS],
        limit: 4,
        cta_label: "Browse all products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000009",
      "featured_v2",
      "Everyday Beauty, Featured",
      "Five Kawaii picks for skincare and cosmetics routines",
      null,
      8,
      {
        eyebrow: "Selected by Kawaii",
        limit: 5,
        cta_label: "Shop the collection",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000010",
      "reviews_v2",
      "Kawaii Customer Voice",
      "A published review from the community",
      null,
      9,
      {
        eyebrow: "Community snapshot",
        limit: 1,
        cta_label: "See customer feedback",
        cta_url: "/reviews",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000011",
      "promo_v2",
      "Kawaii's Featured Collection",
      "Authentic Japanese beauty for everyday care",
      null,
      10,
      {
        promotion_id: TEMPLATE_PROMOTION_ID,
        cta_label: "Discover featured products",
        cta_url: "/product",
      },
    ),
    homepageRow(
      "60000000-0000-4000-8000-000000000012",
      "richtext_v2",
      "Kawaii, Dhaka",
      "Japanese beauty for Bangladesh",
      "<p>Discover authentic Japanese cosmetics through Kawaii, a Dhaka-based Facebook page focused on everyday skincare. Its public page snapshot records 88,594 likes and 143 people talking about the page.</p>",
      11,
      {
        image_path: STORY_EDITORIAL_PATH,
        image_bucket: "branding",
        layout: "feature",
        eyebrow: "Public Facebook snapshot",
        cta_label: "Follow Kawaii on Facebook",
        cta_url: FACEBOOK_URL,
        image_alt: "Japanese skincare collection presented by Kawaii",
        image_label: "Kawaii editorial",
        image_value: "Japanese beauty",
        image_tag: "// DHAKA",
        copy_label: "Public page profile",
        cards_label: "Community snapshot",
        cards: [
          {
            id: "facebook-likes-v2",
            icon: "sparkles",
            label: "88,594 likes",
            detail: "Public Facebook snapshot",
          },
          {
            id: "facebook-talking-v2",
            icon: "zap",
            label: "143 talking",
            detail: "Public Facebook snapshot",
          },
        ],
      },
    ),
  ];
}

export function buildBanners() {
  const copy = [
    {
      title: "Authentic Japanese Cosmetics",
      subtitle: "Discover Kawaii's beauty selection in Bangladesh",
      cta_label: "Shop products",
    },
    {
      title: "Everyday Japanese Skincare",
      subtitle: "Build a routine with Kawaii's skincare collection",
      cta_label: "Explore skincare",
    },
    {
      title: "Kawaii Beauty in Dhaka",
      subtitle: "Follow a community of 88K+ Facebook likes",
      cta_label: "Discover Kawaii",
    },
  ];
  return ["banner", "banner_v2"].flatMap((sectionType, versionIndex) =>
    copy.map((item, index) => ({
      id: `51000000-0000-4000-8000-${String(versionIndex * 3 + index + 1).padStart(12, "0")}`,
      section_type: sectionType,
      ...item,
      image_path: BANNER_PATHS[index],
      mobile_image_path: null,
      cta_url: "/product",
      sort: index,
      active: true,
      starts_at: null,
      ends_at: null,
      created_at: EPOCH,
      updated_at: EPOCH,
    })),
  );
}

function sharedAboutConfig(version) {
  const suffix = version === 2 ? "_v2" : "";
  return [
    aboutRow(
      `about-hero${version === 2 ? "-v2" : ""}`,
      `hero${suffix}`,
      version === 2 ? "Kawaii manifesto" : "Kawaii introduction",
      version === 2 ? 6 : 0,
      {
        eyebrow: version === 2 ? "Kawaii / Dhaka" : "About Kawaii",
        headline_line1:
          version === 2 ? "Japanese beauty." : "Authentic Japanese cosmetics.",
        headline_line2:
          version === 2 ? "Everyday care." : "For everyday skincare.",
        subtitle:
          "Kawaii is a Dhaka-based Facebook page and authentic Japanese cosmetics seller for customers in Bangladesh.",
        cta_primary_label: "Shop products",
        cta_primary_url: "/product",
        cta_secondary_label: "Visit Facebook",
        cta_secondary_url: FACEBOOK_URL,
        image_path: BANNER_PATHS[version === 2 ? 2 : 0],
        image_bucket: "banner",
      },
    ),
    aboutRow(
      `about-stats${version === 2 ? "-v2" : ""}`,
      `stats${suffix}`,
      version === 2 ? "Kawaii signals" : "Kawaii snapshot",
      version === 2 ? 7 : 1,
      {
        items: [
          { label: "Facebook likes · public snapshot", value: "88K+" },
          { label: "Talking about this · snapshot", value: "143" },
          { label: "Based in", value: "Dhaka" },
          { label: "Serving", value: "Bangladesh" },
        ],
      },
    ),
    aboutRow(
      `about-story${version === 2 ? "-v2" : ""}`,
      `story${suffix}`,
      version === 2 ? "Kawaii editorial" : "Kawaii story",
      version === 2 ? 8 : 2,
      {
        eyebrow: version === 2 ? "An everyday destination" : "Meet Kawaii",
        title:
          version === 2
            ? "Japanese beauty, made easier to explore."
            : "A Japanese cosmetics destination in Bangladesh.",
        body_html:
          "<p>Kawaii brings authentic Japanese cosmetics and skincare into one approachable collection for beauty shoppers in Bangladesh.</p><p>The brand's Dhaka-based Facebook page shares products and everyday skincare inspiration with its community.</p>",
        extra:
          "The public Facebook snapshot records 88,594 likes and 143 people talking about the page.",
        image_path: BANNER_PATHS[version === 2 ? 0 : 1],
        image_bucket: "banner",
      },
    ),
    aboutRow(
      `about-values${version === 2 ? "-v2" : ""}`,
      `values${suffix}`,
      version === 2 ? "Kawaii principles" : "What Kawaii offers",
      version === 2 ? 9 : 3,
      {
        eyebrow: version === 2 ? "The Kawaii approach" : "What matters",
        title:
          version === 2
            ? "Clear choices for everyday beauty."
            : "Authenticity, relevance, and everyday care.",
        items: [
          {
            title: "Authentic Japanese cosmetics",
            body: "A collection centered on authentic Japanese beauty products.",
          },
          {
            title: "Everyday skincare",
            body: "Products for practical skincare and beauty routines.",
          },
          {
            title: "Bangladesh destination",
            body: "A Dhaka-based page helping customers explore Japanese cosmetics.",
          },
        ],
      },
    ),
    aboutRow(
      `about-craft${version === 2 ? "-v2" : ""}`,
      `craft${suffix}`,
      version === 2 ? "Kawaii profile study" : "Kawaii collection focus",
      version === 2 ? 10 : 4,
      {
        eyebrow: version === 2 ? "Collection blueprint" : "The Kawaii focus",
        title_line1:
          version === 2 ? "Authentic beauty," : "Japanese cosmetics,",
        title_line2: version === 2 ? "everyday routines." : "thoughtful routines.",
        body:
          "Kawaii focuses on authentic Japanese cosmetics and everyday skincare for beauty shoppers in Bangladesh.",
        image_path: FACEBOOK_PROFILE_PATH,
        image_bucket: "branding",
        fabric_label: "Facebook page",
        fabric_value: "Kawaii Cosmetics BD",
        fabric_tag: "// DHAKA",
        items: [
          { icon: "Sparkles", label: "Cosmetics", sub: "Japanese beauty" },
          { icon: "Layers", label: "Skincare", sub: "Everyday routines" },
          { icon: "Award", label: "Authenticity", sub: "Core product focus" },
          { icon: "Zap", label: "Discovery", sub: "Product updates" },
          { icon: "Shirt", label: "Community", sub: "88K+ page likes" },
          { icon: "Scissors", label: "Location", sub: "Dhaka, Bangladesh" },
        ],
      },
    ),
    aboutRow(
      `about-cta${version === 2 ? "-v2" : ""}`,
      `cta${suffix}`,
      version === 2 ? "Explore with Kawaii" : "Connect with Kawaii",
      version === 2 ? 11 : 5,
      {
        eyebrow: version === 2 ? "Continue with Kawaii" : "Kawaii community",
        title:
          version === 2
            ? "Make Japanese beauty part of your routine."
            : "Explore authentic Japanese beauty.",
        body:
          "Browse Kawaii's cosmetics and skincare collection, or visit the public Facebook page for updates from Dhaka.",
        cta_primary_label: "Explore products",
        cta_primary_url: "/product",
        cta_secondary_label: "Visit Facebook",
        cta_secondary_url: FACEBOOK_URL,
      },
    ),
  ];
}

export function buildAboutSections() {
  return [...sharedAboutConfig(1), ...sharedAboutConfig(2)];
}

export function buildPromotion() {
  return {
    id: TEMPLATE_PROMOTION_ID,
    title: "Kawaii Featured Collection",
    description:
      "Explore authentic Japanese cosmetics and everyday skincare selected for the Kawaii collection.",
    image_path: null,
    discount_percent: null,
    active: true,
    starts_at: null,
    ends_at: null,
    cta_url: "/product",
    cta_label: "Explore the collection",
  };
}

export function buildDesiredState() {
  return {
    homepageSections: buildHomepageSections(),
    banners: buildBanners(),
    aboutSections: buildAboutSections(),
    promotion: buildPromotion(),
    facebook: FACEBOOK_URL,
    facebookProfile: {
      bucket: "branding",
      path: FACEBOOK_PROFILE_PATH,
    },
    storyAssets: [STORY_CLASSIC_PATH, STORY_EDITORIAL_PATH].map((path) => ({
      bucket: "branding",
      path,
    })),
    bannerAssets: BANNER_PATHS.map((path) => ({
      bucket: "banner-images",
      path,
    })),
  };
}

export function desiredChecksum(desired = buildDesiredState()) {
  return createHash("sha256").update(stableStringify(desired)).digest("hex");
}

function withoutTimestamps(rows) {
  return rows.map(({ created_at, updated_at, ...row }) => row);
}

function dbHomepageRows(desired) {
  return withoutTimestamps(desired.homepageSections);
}

function dbBannerRows(desired) {
  return withoutTimestamps(desired.banners);
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function equal(left, right) {
  return stableStringify(left) === stableStringify(right);
}

export function ledgerStatus(sourceUrl, checksum) {
  if (!sourceUrl) return "missing";
  return sourceUrl === `${FACEBOOK_URL}#sha256=${checksum}` ? "match" : "changed";
}

export function compareCurrentState(row, desired = buildDesiredState()) {
  const homepageRows = parseJson(row?.homepage_rows, []);
  const bannerRows = parseJson(row?.banner_rows, []);
  const cmsHomepage = parseJson(row?.cms_homepage, []);
  const cmsBanners = parseJson(row?.cms_banners, []);
  const aboutRows = parseJson(row?.about_rows, []);
  const promotion = parseJson(row?.promotion, null);
  const storageNames = new Set(parseJson(row?.storage_names, []));
  const changed = [];
  if (!equal(homepageRows, dbHomepageRows(desired))) changed.push("homepageRows");
  if (!equal(bannerRows, dbBannerRows(desired))) changed.push("bannerRows");
  if (!equal(aboutRows, desired.aboutSections)) changed.push("aboutRows");
  if (!equal(cmsHomepage, desired.homepageSections)) {
    changed.push("cmsHomepageMirror");
  }
  if (!equal(cmsBanners, desired.banners)) changed.push("cmsBannerMirror");
  if (row?.facebook !== desired.facebook) changed.push("facebook");
  if (!equal(promotion, desired.promotion)) changed.push("promotion");
  const missingBannerAssets = desired.bannerAssets
    .map(({ path }) => path)
    .filter((path) => !storageNames.has(`banner-images/${path}`));
  if (missingBannerAssets.length) changed.push("bannerAssets");
  const profileExists = storageNames.has(
    `${desired.facebookProfile.bucket}/${desired.facebookProfile.path}`,
  );
  if (!profileExists) changed.push("facebookProfile");
  const missingStoryAssets = desired.storyAssets
    .map(({ path }) => path)
    .filter((path) => !storageNames.has(`branding/${path}`));
  if (missingStoryAssets.length) changed.push("storyAssets");
  return {
    changed,
    profileExists,
    missingBannerAssets,
    missingStoryAssets,
    currentCounts: {
      homepage: Number(row?.homepage_count ?? homepageRows.length),
      homepageActive: Number(row?.homepage_active_count ?? 0),
      banners: Number(row?.banner_count ?? bannerRows.length),
      bannerV1: Number(row?.banner_v1_count ?? 0),
      bannerV2: Number(row?.banner_v2_count ?? 0),
      bannersActive: Number(row?.banner_active_count ?? 0),
      about: aboutRows.length,
      aboutActive: aboutRows.filter((item) => item?.active === true).length,
    },
    desiredCounts: {
      homepage: desired.homepageSections.length,
      homepageActive: desired.homepageSections.filter((item) => item.active).length,
      banners: desired.banners.length,
      bannerV1: desired.banners.filter((item) => item.section_type === "banner").length,
      bannerV2: desired.banners.filter((item) => item.section_type === "banner_v2").length,
      bannersActive: desired.banners.filter((item) => item.active).length,
      about: desired.aboutSections.length,
      aboutActive: desired.aboutSections.filter((item) => item.active).length,
    },
  };
}

export function buildStateSql() {
  const types = HOMEPAGE_TYPES.map(sqlLiteral).join(", ");
  const bannerIds = buildBanners().map((row) => sqlLiteral(row.id)).join(", ");
  const storage = [
    ...BANNER_PATHS.map((path) => `banner-images/${path}`),
    `branding/${FACEBOOK_PROFILE_PATH}`,
    `branding/${STORY_CLASSIC_PATH}`,
    `branding/${STORY_EDITORIAL_PATH}`,
  ]
    .map(sqlLiteral)
    .join(", ");
  return `
select
  (select client_id from provisioning.store_identity where singleton = true) as client_id,
  (select source_url from provisioning.content_migrations where migration_key = ${sqlLiteral(MIGRATION_KEY)}) as ledger_source,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'type', type, 'title', title, 'subtitle', subtitle,
      'body', body, 'sort', sort, 'active', active, 'config', config
    ) order by sort, id)
    from public.homepage_sections
    where type in (${types})
  ), '[]'::jsonb) as homepage_rows,
  (select count(*)::int from public.homepage_sections where type in (${types})) as homepage_count,
  (select count(*)::int from public.homepage_sections where type in (${types}) and active) as homepage_active_count,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'section_type', section_type, 'title', title,
      'subtitle', subtitle, 'image_path', image_path,
      'mobile_image_path', mobile_image_path, 'cta_label', cta_label,
      'cta_url', cta_url, 'sort', sort, 'active', active,
      'starts_at', starts_at, 'ends_at', ends_at
    ) order by section_type, sort, id)
    from public.banners
    where id in (${bannerIds}) or section_type in ('banner', 'banner_v2')
  ), '[]'::jsonb) as banner_rows,
  (select count(*)::int from public.banners where section_type in ('banner', 'banner_v2')) as banner_count,
  (select count(*)::int from public.banners where section_type = 'banner') as banner_v1_count,
  (select count(*)::int from public.banners where section_type = 'banner_v2') as banner_v2_count,
  (select count(*)::int from public.banners where section_type in ('banner', 'banner_v2') and active) as banner_active_count,
  coalesce((select socials #> '{_cms,homepage_sections}' from public.site_settings where id = 1), '[]'::jsonb) as cms_homepage,
  coalesce((select socials #> '{_cms,banners}' from public.site_settings where id = 1), '[]'::jsonb) as cms_banners,
  coalesce((select socials #> '{_cms,about_sections}' from public.site_settings where id = 1), '[]'::jsonb) as about_rows,
  (select socials ->> 'facebook' from public.site_settings where id = 1) as facebook,
  (select jsonb_build_object(
    'id', id::text, 'title', title, 'description', description,
    'image_path', image_path, 'discount_percent', discount_percent,
    'active', active, 'starts_at', starts_at, 'ends_at', ends_at,
    'cta_url', cta_url, 'cta_label', cta_label
  ) from public.promotions where id = ${sqlLiteral(TEMPLATE_PROMOTION_ID)}::uuid) as promotion,
  coalesce((
    select jsonb_agg(bucket_id || '/' || name order by bucket_id, name)
    from storage.objects
    where bucket_id || '/' || name in (${storage})
  ), '[]'::jsonb) as storage_names;
`;
}

function homepageValues(rows) {
  return rows
    .map(
      (row) =>
        `(${sqlLiteral(row.id)}::uuid, ${sqlLiteral(row.type)}, ${row.title === null ? "null" : sqlLiteral(row.title)}, ${row.subtitle === null ? "null" : sqlLiteral(row.subtitle)}, ${row.body === null ? "null" : sqlLiteral(row.body)}, ${row.sort}, ${row.active}, ${sqlLiteral(JSON.stringify(row.config))}::jsonb)`,
    )
    .join(",\n");
}

function bannerValues(rows) {
  return rows
    .map(
      (row) =>
        `(${sqlLiteral(row.id)}::uuid, ${sqlLiteral(row.section_type)}, ${sqlLiteral(row.title)}, ${sqlLiteral(row.subtitle)}, ${sqlLiteral(row.image_path)}, null, ${sqlLiteral(row.cta_label)}, ${sqlLiteral(row.cta_url)}, ${row.sort}, ${row.active}, null, null)`,
    )
    .join(",\n");
}

export function buildApplySql(
  desired = buildDesiredState(),
  checksum = desiredChecksum(desired),
  { replace = false } = {},
) {
  const types = HOMEPAGE_TYPES.map(sqlLiteral).join(", ");
  const desiredSource = `${FACEBOOK_URL}#sha256=${checksum}`;
  const homepageJson = sqlLiteral(JSON.stringify(desired.homepageSections));
  const bannerJson = sqlLiteral(JSON.stringify(desired.banners));
  const aboutJson = sqlLiteral(JSON.stringify(desired.aboutSections));
  const homepageDbJson = sqlLiteral(JSON.stringify(dbHomepageRows(desired)));
  const bannerDbJson = sqlLiteral(JSON.stringify(dbBannerRows(desired)));
  const promotion = desired.promotion;
  const replaceGuard = replace
    ? `if existing_source is null or existing_source = ${sqlLiteral(desiredSource)} then
      raise exception 'The --replace guard requires a changed Kawaii checksum';
    end if;`
    : `if existing_source is not null and existing_source <> ${sqlLiteral(desiredSource)} then
      raise exception 'Kawaii content checksum changed; use --replace';
    end if;`;
  const assetChecks = [
    ...desired.bannerAssets,
    desired.facebookProfile,
    ...desired.storyAssets,
  ]
    .map(
      ({ bucket, path }) =>
        `(bucket_id = ${sqlLiteral(bucket)} and name = ${sqlLiteral(path)})`,
    )
    .join(" or ");
  return `
begin;
select pg_advisory_xact_lock(hashtext('kawaii-home-about-v2'));
lock table provisioning.store_identity in share mode;
lock table provisioning.content_migrations in share row exclusive mode;
lock table public.homepage_sections in share row exclusive mode;
lock table public.banners in share row exclusive mode;
lock table public.promotions in share row exclusive mode;
lock table public.site_settings in share row exclusive mode;
do $$
declare
  existing_source text;
begin
  if (select client_id from provisioning.store_identity where singleton = true) is distinct from ${sqlLiteral(KAWAII_CLIENT_ID)} then
    raise exception 'Supabase store identity does not match Kawaii';
  end if;
  if (select count(*) from public.site_settings where id = 1) <> 1 then
    raise exception 'Kawaii singleton settings row is unavailable';
  end if;
  if (select count(*) from public.categories where id in (${CATEGORY_IDS.map((id) => `${sqlLiteral(id)}::uuid`).join(", ")})) <> ${CATEGORY_IDS.length} then
    raise exception 'Kawaii selected categories are unavailable';
  end if;
  if (select count(*) from storage.objects where ${assetChecks}) <> ${desired.bannerAssets.length + desired.storyAssets.length + 1} then
    raise exception 'Required Kawaii content assets are unavailable';
  end if;
  select source_url into existing_source
  from provisioning.content_migrations
  where migration_key = ${sqlLiteral(MIGRATION_KEY)};
  ${replaceGuard}
end;
$$;
delete from public.homepage_sections
where type in (${types});
insert into public.homepage_sections (id, type, title, subtitle, body, sort, active, config)
values
${homepageValues(desired.homepageSections)};
delete from public.banners
where section_type in ('banner', 'banner_v2');
insert into public.banners (
  id, section_type, title, subtitle, image_path, mobile_image_path,
  cta_label, cta_url, sort, active, starts_at, ends_at
)
values
${bannerValues(desired.banners)};
insert into public.promotions (
  id, title, description, image_path, discount_percent, active,
  starts_at, ends_at, cta_url, cta_label
)
values (
  ${sqlLiteral(promotion.id)}::uuid,
  ${sqlLiteral(promotion.title)},
  ${sqlLiteral(promotion.description)},
  null,
  null,
  true,
  null,
  null,
  ${sqlLiteral(promotion.cta_url)},
  ${sqlLiteral(promotion.cta_label)}
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  image_path = excluded.image_path,
  discount_percent = excluded.discount_percent,
  active = excluded.active,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  cta_url = excluded.cta_url,
  cta_label = excluded.cta_label;
update public.site_settings
set socials = jsonb_set(
  jsonb_set(
    coalesce(socials, '{}'::jsonb),
    '{facebook}',
    to_jsonb(${sqlLiteral(desired.facebook)}::text),
    true
  ),
  '{_cms}',
  (case
    when jsonb_typeof(socials -> '_cms') = 'object' then socials -> '_cms'
    else '{}'::jsonb
  end) || jsonb_build_object(
    'banners', ${bannerJson}::jsonb,
    'homepage_sections', ${homepageJson}::jsonb,
    'about_sections', ${aboutJson}::jsonb
  ),
  true
)
where id = 1;
insert into provisioning.content_migrations (migration_key, source_url)
values (${sqlLiteral(MIGRATION_KEY)}, ${sqlLiteral(desiredSource)})
on conflict (migration_key) do update
set source_url = excluded.source_url,
    applied_at = now();
do $$
begin
  if coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'type', type, 'title', title, 'subtitle', subtitle,
      'body', body, 'sort', sort, 'active', active, 'config', config
    ) order by sort, id)
    from public.homepage_sections
    where type in (${types})
  ), '[]'::jsonb) <> ${homepageDbJson}::jsonb then
    raise exception 'Kawaii homepage assertion failed';
  end if;
  if coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'section_type', section_type, 'title', title,
      'subtitle', subtitle, 'image_path', image_path,
      'mobile_image_path', mobile_image_path, 'cta_label', cta_label,
      'cta_url', cta_url, 'sort', sort, 'active', active,
      'starts_at', starts_at, 'ends_at', ends_at
    ) order by section_type, sort, id)
    from public.banners
    where section_type in ('banner', 'banner_v2')
  ), '[]'::jsonb) <> ${bannerDbJson}::jsonb then
    raise exception 'Kawaii banner assertion failed';
  end if;
  if (select socials #> '{_cms,homepage_sections}' from public.site_settings where id = 1) <> ${homepageJson}::jsonb
    or (select socials #> '{_cms,banners}' from public.site_settings where id = 1) <> ${bannerJson}::jsonb
    or (select socials #> '{_cms,about_sections}' from public.site_settings where id = 1) <> ${aboutJson}::jsonb
    or (select socials ->> 'facebook' from public.site_settings where id = 1) <> ${sqlLiteral(desired.facebook)} then
    raise exception 'Kawaii CMS assertion failed';
  end if;
  if exists (
    select 1 from public.promotions
    where id = ${sqlLiteral(promotion.id)}::uuid
      and (image_path is not null or discount_percent is not null
        or title <> ${sqlLiteral(promotion.title)}
        or description <> ${sqlLiteral(promotion.description)}
        or not active)
  ) or not exists (
    select 1 from public.promotions where id = ${sqlLiteral(promotion.id)}::uuid
  ) then
    raise exception 'Kawaii promotion assertion failed';
  end if;
end;
$$;
commit;
`;
}

function planFromState(row, desired, checksum, apply) {
  const comparison = compareCurrentState(row, desired);
  const ledger = ledgerStatus(row?.ledger_source, checksum);
  return {
    apply,
    checksum,
    ledger: {
      status: ledger,
      migrationKey: MIGRATION_KEY,
    },
    counts: {
      current: comparison.currentCounts,
      desired: comparison.desiredCounts,
    },
    changed: comparison.changed,
    assets: {
      bannerAssetsExist: comparison.missingBannerAssets.length === 0,
      missingBannerAssets: comparison.missingBannerAssets,
      facebookProfileExists: comparison.profileExists,
      facebookProfileUploadNeeded: !comparison.profileExists,
      missingStoryAssets: comparison.missingStoryAssets,
      storyUploadNeeded: comparison.missingStoryAssets.length > 0,
    },
  };
}

function validateManifest(manifest) {
  if (manifest.id !== KAWAII_CLIENT_ID) {
    throw new Error("Client manifest does not identify Kawaii");
  }
  if (manifest.supabase?.projectRef !== KAWAII_PROJECT_REF) {
    throw new Error("Client manifest does not reference the Kawaii Supabase project");
  }
  if (manifest.supabase?.url !== `https://${KAWAII_PROJECT_REF}.supabase.co`) {
    throw new Error("Client manifest has an invalid Kawaii Supabase URL");
  }
}

function validateProfileSource(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("FACEBOOK_PROFILE_IMAGE_URL must be a valid HTTPS URL");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("FACEBOOK_PROFILE_IMAGE_URL must be a valid HTTPS URL");
  }
  return url.toString();
}

async function createKawaiiStorageClient(managementRequest, projectRef) {
  const keyResponse = await managementRequest(`/v1/projects/${projectRef}/api-keys`);
  const keys = Array.isArray(keyResponse) ? keyResponse : keyResponse?.keys ?? [];
  const serviceRole = keys.find(
    (key) => key.type === "legacy" && key.name === "service_role",
  )?.api_key;
  if (!serviceRole) throw new Error("Kawaii service-role key is unavailable");
  maskSecret(serviceRole);
  return createClient(`https://${projectRef}.supabase.co`, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createSupabaseFetch(serviceRole) },
  });
}

async function uploadBrandingAsset(supabase, path, content, contentType) {
  const { error } = await supabase.storage.from("branding").upload(path, content, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Branding asset upload failed: ${error.message}`);
}

async function uploadFacebookProfile(supabase, sourceValue) {
  const sourceUrl = validateProfileSource(sourceValue);
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "ReverbCommerceKawaiiContent/2.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error("Facebook profile image request failed");
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (!contentType.startsWith("image/")) {
    throw new Error("FACEBOOK_PROFILE_IMAGE_URL did not return an image");
  }
  if (declaredLength > MAX_IMAGE_BYTES) {
    throw new Error("Facebook profile image exceeds 10 MB");
  }
  const content = Buffer.from(await response.arrayBuffer());
  if (content.length > MAX_IMAGE_BYTES) {
    throw new Error("Facebook profile image exceeds 10 MB");
  }
  await uploadBrandingAsset(
    supabase,
    FACEBOOK_PROFILE_PATH,
    content,
    contentType,
  );
}

async function uploadStoryAsset(supabase, path, sourcePath) {
  if (!sourcePath) throw new Error(`A local source file is required for ${path}`);
  const content = readFileSync(resolve(sourcePath));
  const isWebp =
    content.length >= 12 &&
    content.subarray(0, 4).toString("ascii") === "RIFF" &&
    content.subarray(8, 12).toString("ascii") === "WEBP";
  if (!isWebp) throw new Error(`Story source is not a WebP image: ${path}`);
  if (content.length > MAX_IMAGE_BYTES) {
    throw new Error(`Story image exceeds 10 MB: ${path}`);
  }
  await uploadBrandingAsset(supabase, path, content, "image/webp");
}

function assertVerified(row, desired, checksum) {
  if (row?.client_id !== KAWAII_CLIENT_ID) {
    throw new Error("Supabase store identity does not match Kawaii");
  }
  const comparison = compareCurrentState(row, desired);
  if (comparison.changed.length) {
    throw new Error(
      `Kawaii homepage/About verification failed: ${comparison.changed.join(", ")}`,
    );
  }
  if (ledgerStatus(row?.ledger_source, checksum) !== "match") {
    throw new Error("Kawaii content migration ledger verification failed");
  }
  return comparison;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv);
  const apply = args.apply === true;
  const replace = args.replace === true;
  const { manifest } = loadClient(KAWAII_CLIENT_ID);
  validateManifest(manifest);
  const secrets = parseEnvFile(
    resolve(repositoryRoot, ".client-secrets", "kawaii.env"),
  );
  const accessToken = secrets.SUPABASE_ACCESS_TOKEN?.trim();
  if (!accessToken) throw new Error("SUPABASE_ACCESS_TOKEN is missing");
  maskSecret(accessToken);
  const managementRequest = (path, options = {}) =>
    requestJson(`${SUPABASE_API}${path}`, {
      token: accessToken,
      ...options,
    });
  const runSql = (query, readOnly = false) =>
    managementRequest(`/v1/projects/${KAWAII_PROJECT_REF}/database/query`, {
      method: "POST",
      body: { query, read_only: readOnly },
      expected: [201],
    });
  const desired = buildDesiredState();
  const checksum = desiredChecksum(desired);
  let current = responseRows(await runSql(buildStateSql(), true))[0];
  if (current?.client_id !== KAWAII_CLIENT_ID) {
    throw new Error("Supabase store identity does not match Kawaii");
  }
  const plan = planFromState(current, desired, checksum, apply);
  if (replace && plan.ledger.status !== "changed") {
    throw new Error("--replace is only valid when the desired checksum changed");
  }
  if (!apply) {
    console.log(JSON.stringify(plan, null, 2));
    return plan;
  }
  if (plan.ledger.status === "changed" && !replace) {
    throw new Error("Kawaii content checksum changed; rerun with --apply --replace");
  }
  if (!plan.assets.bannerAssetsExist) {
    throw new Error("Required Kawaii banner assets are missing");
  }
  const assetUploadNeeded =
    plan.assets.facebookProfileUploadNeeded || plan.assets.storyUploadNeeded;
  const storageClient = assetUploadNeeded
    ? await createKawaiiStorageClient(managementRequest, KAWAII_PROJECT_REF)
    : null;
  if (plan.assets.facebookProfileUploadNeeded) {
    const source =
      process.env.FACEBOOK_PROFILE_IMAGE_URL?.trim() ||
      secrets.FACEBOOK_PROFILE_IMAGE_URL?.trim();
    if (!source) {
      throw new Error(
        "FACEBOOK_PROFILE_IMAGE_URL is required because the profile object is missing",
      );
    }
    await uploadFacebookProfile(storageClient, source);
  }
  for (const path of plan.assets.missingStoryAssets) {
    const source =
      path === STORY_CLASSIC_PATH
        ? process.env.STORY_CLASSIC_IMAGE_FILE?.trim()
        : process.env.STORY_EDITORIAL_IMAGE_FILE?.trim();
    await uploadStoryAsset(storageClient, path, source);
  }
  if (assetUploadNeeded) {
    current = responseRows(await runSql(buildStateSql(), true))[0];
    const assets = compareCurrentState(current, desired);
    if (!assets.profileExists || assets.missingStoryAssets.length) {
      throw new Error("Kawaii Story asset upload verification failed");
    }
  }
  const stateChanged = plan.changed.some(
    (category) => !["facebookProfile", "storyAssets"].includes(category),
  );
  if (stateChanged || assetUploadNeeded || plan.ledger.status !== "match") {
    await runSql(buildApplySql(desired, checksum, { replace }));
  }
  const verifiedRow = responseRows(await runSql(buildStateSql(), true))[0];
  const verification = assertVerified(verifiedRow, desired, checksum);
  const result = {
    ...plan,
    noOp: !stateChanged && plan.ledger.status === "match" && !assetUploadNeeded,
    verification: {
      homepage: verification.desiredCounts.homepage,
      banners: verification.desiredCounts.banners,
      about: verification.desiredCounts.about,
      assets: desired.bannerAssets.length + desired.storyAssets.length + 1,
    },
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
