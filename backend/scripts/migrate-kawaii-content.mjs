import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sanitizeHtml from "sanitize-html";
import { clientsDirectory, repositoryRoot } from "./client-registry.mjs";
import {
  createSupabaseFetch,
  maskSecret,
  normalizeHttpsUrl,
  requestJson,
  responseRows,
  sqlLiteral,
} from "./provisioning-core.mjs";

const SUPABASE_API = "https://api.supabase.com";
const KAWAII_PROJECT_REF = "dpgzrukkmoyvrzubaenx";
const PAGE_MAPPINGS = [
  ["about-kawaii-cosmetics-bangladesh", "about"],
  ["term-and-conditions", "terms"],
  ["privacy-policy", "privacy"],
  ["returns-exchange", "refund"],
  ["faqs", "faqs"],
  ["wholesale", "wholesale"],
  ["pre-order-kawaii-cosmetics", "pre-order"],
  ["doctor-consultant", "doctor-consultant"],
  ["brands", "brands"],
];
const FIXED_ASSETS = [
  ["https://kawaii.com.bd/wp-content/uploads/Kawaii-Logo.webp", "logo.webp"],
  ["https://kawaii.com.bd/wp-content/uploads/Kawaii-Logo.webp", "invoice-logo.webp"],
  [
    "https://kawaii.com.bd/wp-content/uploads/cropped-Kawaii-Logo-1-192x192.webp",
    "favicon.webp",
  ],
  ["https://kawaii.com.bd/wp-content/uploads/payment.png", "payment-methods.png"],
];
const BANNER_ASSETS = [
  ["https://kawaii.com.bd/wp-content/uploads/Banner-1-3.webp", "banner-1.webp"],
  ["https://kawaii.com.bd/wp-content/uploads/Banner-2-2.webp", "banner-2.webp"],
  ["https://kawaii.com.bd/wp-content/uploads/Banner-3-4.webp", "banner-3.webp"],
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
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
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

export function sanitizeImportedHtml(value) {
  return sanitizeHtml(String(value ?? ""), {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "div",
      "span",
      "section",
      "article",
      "header",
      "footer",
      "main",
      "figure",
      "figcaption",
      "picture",
      "source",
      "img",
      "h1",
      "h2",
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
  });
}

function stripHtml(value) {
  return decodeHtml(
    String(value ?? "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function sourceAssetUrls(html) {
  return [
    ...new Set(
      String(html).match(
        /https?:\/\/(?:www\.)?kawaii\.com\.bd\/wp-content\/uploads\/[^"'()\s<>]+/gi,
      ) ?? [],
    ),
  ];
}

function safeExtension(url, contentType) {
  const pathname = new URL(url).pathname.toLowerCase();
  const matched = pathname.match(/\.(webp|png|jpe?g|gif|svg)$/);
  if (matched) return matched[1] === "jpeg" ? "jpg" : matched[1];
  const byType = {
    "image/webp": "webp",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return byType[contentType] ?? "bin";
}

async function fetchSource(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "ReverbCommerceKawaiiMigration/1.0" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`Source request failed ${response.status}: ${url}`);
  return response;
}

async function fetchPages(sourceUrl) {
  const response = await fetchSource(
    `${sourceUrl}/wp-json/wp/v2/pages?per_page=100`,
  );
  const pages = await response.json();
  return new Map(pages.map((page) => [page.slug, page]));
}

function buildAboutSections(aboutHtml, bannerPath, now) {
  return [
    {
      id: "about-hero",
      type: "hero",
      title: "Hero",
      sort: 0,
      active: true,
      config: {
        eyebrow: "Our story",
        headline_line1: "Authentic Japanese beauty.",
        headline_line2: "Made accessible in Bangladesh.",
        subtitle:
          "A family-run destination for authentic and affordable Japanese cosmetics, skincare, and personal care.",
        cta_primary_label: "Shop products",
        cta_primary_url: "/product",
        cta_secondary_label: "Talk to us",
        cta_secondary_url: "/contact-us",
        image_path: bannerPath,
        image_bucket: "banner",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "about-stats",
      type: "stats",
      title: "Stats bar",
      sort: 1,
      active: true,
      config: {
        items: [
          { label: "Founded", value: "2022" },
          { label: "Sourcing", value: "Direct from Japan" },
          { label: "Delivery", value: "Nationwide" },
          { label: "Business", value: "Family-run" },
        ],
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "about-story",
      type: "story",
      title: "Story",
      sort: 2,
      active: true,
      config: {
        eyebrow: "About Kawaii",
        title: "Authentic and affordable Japanese cosmetics.",
        body_html: aboutHtml,
        extra:
          "We source products directly from Japan and serve customers across Bangladesh from our online store in Mirpur, Dhaka.",
        image_path: bannerPath,
        image_bucket: "banner",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "about-values",
      type: "values",
      title: "Values",
      sort: 3,
      active: true,
      config: {
        eyebrow: "What we stand for",
        title: "Authenticity, affordability, and care.",
        items: [
          {
            title: "Authentic products",
            body: "Japanese cosmetics and personal-care products sourced directly from Japan.",
          },
          {
            title: "Fair value",
            body: "Affordable access to trusted Japanese beauty products in Bangladesh.",
          },
          {
            title: "Helpful service",
            body: "Responsive support, nationwide delivery, and clear shopping guidance.",
          },
        ],
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "about-craft",
      type: "craft",
      title: "Product standards",
      sort: 4,
      active: true,
      config: {
        eyebrow: "Our promise",
        title_line1: "Japanese quality,",
        title_line2: "delivered with care.",
        body:
          "Kawaii focuses on genuine Japanese beauty and personal-care products, careful sourcing, and dependable service throughout Bangladesh.",
        image_path: "kawaii-content/v1/logo.webp",
        image_bucket: "branding",
        fabric_label: "Source",
        fabric_value: "Japan",
        fabric_tag: "// AUTHENTIC",
        items: [
          { icon: "Sparkles", label: "Authentic", sub: "Sourced from Japan" },
          { icon: "Award", label: "Trusted", sub: "Quality-focused selection" },
          { icon: "Layers", label: "Variety", sub: "Beauty and personal care" },
          { icon: "Zap", label: "Support", sub: "Responsive customer care" },
          { icon: "Shirt", label: "Delivery", sub: "Available nationwide" },
          { icon: "Scissors", label: "Value", sub: "Affordable pricing" },
        ],
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "about-cta",
      type: "cta",
      title: "Community CTA",
      sort: 5,
      active: true,
      config: {
        eyebrow: "Kawaii community",
        title: "Discover Japanese beauty with confidence.",
        body:
          "Explore authentic skincare, cosmetics, hair care, and personal-care products selected for customers across Bangladesh.",
        cta_primary_label: "Explore products",
        cta_primary_url: "/product",
        cta_secondary_label: "Contact Kawaii",
        cta_secondary_url: "/contact-us",
      },
      created_at: now,
      updated_at: now,
    },
  ];
}

async function main() {
  const projectRef = required("SUPABASE_PROJECT_REF");
  if (projectRef !== KAWAII_PROJECT_REF) {
    throw new Error("SUPABASE_PROJECT_REF does not match the Kawaii project");
  }
  const managementToken = required("SUPABASE_ACCESS_TOKEN");
  const sourceUrl = normalizeHttpsUrl(
    process.env.SOURCE_URL?.trim() || "https://kawaii.com.bd",
    "SOURCE_URL",
  );
  maskSecret(managementToken);

  const managementRequest = (path, options = {}) =>
    requestJson(`${SUPABASE_API}${path}`, {
      token: managementToken,
      ...options,
    });
  const runSql = (query, readOnly = false) =>
    managementRequest(`/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      body: { query, read_only: readOnly },
      expected: [201],
    });
  const identity = responseRows(
    await runSql(
      "select client_id from provisioning.store_identity where singleton = true",
      true,
    ),
  )[0];
  if (identity?.client_id !== "kawaii") {
    throw new Error("Supabase store identity does not match Kawaii");
  }
  const migrationStateRelation = responseRows(
    await runSql(
      "select to_regclass('provisioning.content_migrations')::text as relation",
      true,
    ),
  )[0]?.relation;
  if (migrationStateRelation && !process.argv.includes("--force")) {
    const completed = responseRows(
      await runSql(
        "select migration_key from provisioning.content_migrations where migration_key = 'kawaii-wordpress-v1'",
        true,
      ),
    )[0];
    if (completed) {
      throw new Error("Kawaii content is already migrated; use --force to replace it");
    }
  }

  const keyResponse = await managementRequest(
    `/v1/projects/${projectRef}/api-keys`,
  );
  const keys = Array.isArray(keyResponse) ? keyResponse : keyResponse?.keys ?? [];
  const anonKey = keys.find(
    (key) => key.type === "legacy" && key.name === "anon",
  )?.api_key;
  const serviceRole = keys.find(
    (key) => key.type === "legacy" && key.name === "service_role",
  )?.api_key;
  if (!anonKey || !serviceRole) {
    throw new Error("Legacy Supabase project keys are unavailable");
  }
  maskSecret(anonKey);
  maskSecret(serviceRole);

  const projectUrl = `https://${projectRef}.supabase.co`;
  const supabase = createClient(projectUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createSupabaseFetch(serviceRole) },
  });
  const sourcePages = await fetchPages(sourceUrl);
  const selectedPages = PAGE_MAPPINGS.map(([sourceSlug, targetSlug]) => {
    const page = sourcePages.get(sourceSlug);
    if (!page) throw new Error(`Source page is missing: ${sourceSlug}`);
    return { sourceSlug, targetSlug, page };
  });

  async function upload(url, bucket, path) {
    const response = await fetchSource(url);
    const contentType = response.headers.get("content-type")?.split(";")[0] || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Expected an image from ${url}, received ${contentType}`);
    }
    const content = Buffer.from(await response.arrayBuffer());
    if (content.length > 10 * 1024 * 1024) {
      throw new Error(`Asset exceeds 10 MB: ${url}`);
    }
    const { error } = await supabase.storage.from(bucket).upload(path, content, {
      contentType,
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) throw new Error(`Failed to upload ${bucket}/${path}: ${error.message}`);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  for (const [url, filename] of FIXED_ASSETS) {
    await upload(url, "branding", `kawaii-content/v1/${filename}`);
  }
  for (const [url, filename] of BANNER_ASSETS) {
    await upload(url, "banner-images", `kawaii-content/v1/${filename}`);
  }

  const assetMap = new Map();
  for (const { page } of selectedPages) {
    for (const url of sourceAssetUrls(page.content?.rendered)) {
      if (assetMap.has(url)) continue;
      const response = await fetchSource(url);
      const contentType = response.headers.get("content-type")?.split(";")[0] || "";
      const extension = safeExtension(url, contentType);
      const hash = createHash("sha256").update(url).digest("hex").slice(0, 16);
      const path = `kawaii-content/v1/pages/${hash}.${extension}`;
      const content = Buffer.from(await response.arrayBuffer());
      if (!contentType.startsWith("image/") || content.length > 10 * 1024 * 1024) {
        throw new Error(`Invalid page asset: ${url}`);
      }
      const { error } = await supabase.storage.from("branding").upload(path, content, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) throw new Error(`Failed to upload branding/${path}: ${error.message}`);
      assetMap.set(
        url,
        supabase.storage.from("branding").getPublicUrl(path).data.publicUrl,
      );
    }
  }

  const now = new Date().toISOString();
  const pages = selectedPages.map(({ targetSlug, page }) => {
    let html = sanitizeImportedHtml(page.content?.rendered ?? "");
    for (const [source, target] of assetMap) html = html.split(source).join(target);
    return {
      slug: targetSlug,
      title: decodeHtml(page.title?.rendered),
      body_html: html,
      updated_at: page.modified_gmt ? `${page.modified_gmt}Z` : now,
      seo: page.yoast_head_json ?? {},
    };
  });
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const about = bySlug.get("about");
  if (!about) throw new Error("Mapped About page is unavailable");

  const { data: currentSettings, error: settingsError } = await supabase
    .from("site_settings")
    .select("socials")
    .eq("id", 1)
    .maybeSingle();
  if (settingsError) throw settingsError;
  const existingSocials =
    currentSettings?.socials && typeof currentSettings.socials === "object"
      ? currentSettings.socials
      : {};
  const existingCms =
    existingSocials._cms && typeof existingSocials._cms === "object"
      ? existingSocials._cms
      : {};
  const bannerPath = "kawaii-content/v1/banner-1.webp";
  const fixedPages = Object.fromEntries(
    ["about", "terms", "privacy", "refund"].map((slug) => [slug, bySlug.get(slug)]),
  );
  const homePage = sourcePages.get("home");
  const homeDescription =
    homePage?.yoast_head_json?.description ||
    "Authentic and affordable Japanese cosmetics, skincare, hair care, and personal care in Bangladesh.";
  const pagesSeo = {
    ...(existingCms.pages_seo ?? {}),
    home: {
      title: "Kawaii - Japanese Cosmetics BD",
      description: homeDescription,
      keywords:
        "Kawaii, Japanese cosmetics Bangladesh, Japanese skincare, authentic cosmetics",
      og_image_path: bannerPath,
    },
    about: {
      title: about.seo.title || "About Kawaii | Japanese Cosmetics BD",
      description:
        about.seo.description || "Learn about Kawaii and our authentic Japanese beauty products.",
      keywords: "Kawaii, About Kawaii, Japanese cosmetics Bangladesh",
      og_image_path: bannerPath,
    },
    product: {
      title: "Shop Japanese Cosmetics | Kawaii",
      description: homeDescription,
      keywords: "Japanese skincare, cosmetics, hair care, beauty products Bangladesh",
      og_image_path: bannerPath,
    },
    contact: {
      title: "Contact Kawaii",
      description: "Contact Kawaii for Japanese cosmetics support and product inquiries.",
      keywords: "Kawaii contact, cosmetics support Bangladesh",
      og_image_path: null,
    },
    privacy: {
      title: bySlug.get("privacy")?.seo.title || "Privacy Policy | Kawaii",
      description:
        bySlug.get("privacy")?.seo.description || "Read the Kawaii privacy policy.",
      keywords: "Kawaii privacy policy",
      og_image_path: null,
    },
    terms: {
      title: bySlug.get("terms")?.seo.title || "Terms and Conditions | Kawaii",
      description:
        bySlug.get("terms")?.seo.description || "Read the Kawaii terms and conditions.",
      keywords: "Kawaii terms and conditions",
      og_image_path: null,
    },
    refund: {
      title: bySlug.get("refund")?.seo.title || "Returns and Exchange | Kawaii",
      description:
        bySlug.get("refund")?.seo.description || "Read the Kawaii returns and exchange policy.",
      keywords: "Kawaii returns, exchange policy, delivery Bangladesh",
      og_image_path: null,
    },
  };
  const fallbackBanners = [
    {
      id: "51000000-0000-4000-8000-000000000001",
      section_type: "banner",
      title: "Authentic Japanese Cosmetics",
      subtitle: "Authentic and affordable Japanese beauty products in Bangladesh",
      image_path: "kawaii-content/v1/banner-1.webp",
      mobile_image_path: null,
      cta_label: "Shop now",
      cta_url: "/product",
      sort: 10,
      active: true,
      starts_at: null,
      ends_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "51000000-0000-4000-8000-000000000002",
      section_type: "banner",
      title: "Japanese Skincare & Beauty",
      subtitle: "Carefully sourced products delivered nationwide",
      image_path: "kawaii-content/v1/banner-2.webp",
      mobile_image_path: null,
      cta_label: "Explore products",
      cta_url: "/product",
      sort: 20,
      active: true,
      starts_at: null,
      ends_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "51000000-0000-4000-8000-000000000003",
      section_type: "banner",
      title: "Beauty Made Kawaii",
      subtitle: "Discover skincare, hair care, cosmetics, and personal care",
      image_path: "kawaii-content/v1/banner-3.webp",
      mobile_image_path: null,
      cta_label: "View collection",
      cta_url: "/product",
      sort: 30,
      active: true,
      starts_at: null,
      ends_at: null,
      created_at: now,
      updated_at: now,
    },
  ];
  const fallbackSections = [
    ["60000000-0000-4000-8000-000000000001", "banner", null, null, null, 10, true, {}],
    ["60000000-0000-4000-8000-000000000002", "categories", "Shop by Category", "Explore Japanese beauty and personal care", null, 20, false, { cta_label: "View all products", cta_url: "/product" }],
    ["60000000-0000-4000-8000-000000000003", "featured", "Today's Best Deals", "Authentic Japanese products at great value", null, 30, false, { limit: 6 }],
    ["60000000-0000-4000-8000-000000000004", "reviews", "Customer Reviews", "What Kawaii customers say", null, 40, false, { limit: 12 }],
    ["60000000-0000-4000-8000-000000000005", "richtext", "Authentic Japanese beauty in Bangladesh", null, "<p>Free gift wrapping with notes, responsive customer support, nationwide delivery, and carefully sourced Japanese cosmetics and personal-care products.</p>", 50, true, { eyebrow: "Welcome to Kawaii", cta_label: "Learn about Kawaii", cta_url: "/about-us" }],
    ["60000000-0000-4000-8000-000000000006", "promo", null, null, null, 60, false, {}],
    ["60000000-0000-4000-8000-000000000007", "banner_v2", null, null, null, 70, false, {}],
    ["60000000-0000-4000-8000-000000000008", "categories_v2", "Shop by Category", null, null, 80, false, {}],
    ["60000000-0000-4000-8000-000000000009", "featured_v2", "Featured Products", null, null, 90, false, {}],
    ["60000000-0000-4000-8000-000000000010", "reviews_v2", "Customer Reviews", null, null, 100, false, {}],
    ["60000000-0000-4000-8000-000000000011", "promo_v2", null, null, null, 110, false, {}],
    ["60000000-0000-4000-8000-000000000012", "richtext_v2", "About Kawaii", null, null, 120, false, {}],
  ].map(([id, type, title, subtitle, body, sort, active, config]) => ({
    id,
    type,
    title,
    subtitle,
    body,
    sort,
    active,
    config,
    created_at: now,
    updated_at: now,
  }));
  const cms = {
    ...existingCms,
    banners: fallbackBanners,
    homepage_sections: fallbackSections,
    about_sections: buildAboutSections(about.body_html, bannerPath, now),
    pages: fixedPages,
    announcement: {
      text: "Free nationwide delivery on orders over ৳1,500",
      active: true,
      url: "/product",
    },
    seo: pagesSeo.home,
    pages_seo: pagesSeo,
    currencies: { default: "BDT", enabled: ["BDT"] },
    deliveryCharges: { insideDhaka: 60, outsideDhaka: 120, freeDelivery: false },
    chatWidgets: {
      provider: "whatsapp",
      whatsappNumber: "8801608950309",
      messengerPageId: "kawaiicosmeticsbd",
    },
    favicon_path: "kawaii-content/v1/favicon.webp",
    palette: {
      primary: "#de006e",
      primaryForeground: "#ffffff",
      background: "#ffffff",
      surface: "#fee9f2",
      card: "#ffffff",
      foreground: "#222222",
      mutedForeground: "#666666",
      border: "#f3f3f3",
    },
  };
  const socials = {
    ...existingSocials,
    facebook: "https://web.facebook.com/kawaiicosmeticsbd",
    instagram: "https://www.instagram.com/kawaii_jbeauty_bd/",
    footer_description:
      "Authentic and affordable Japanese cosmetics, skincare, hair care, and personal care in Bangladesh.",
    footer_links: [
      { label: "FAQs", href: "/info/faqs", column: "support" },
      { label: "Wholesale", href: "/info/wholesale", column: "support" },
      { label: "Pre-order", href: "/info/pre-order", column: "brand" },
      { label: "Brands", href: "/info/brands", column: "brand" },
      {
        label: "Doctor consultant",
        href: "/info/doctor-consultant",
        column: "support",
      },
    ],
    payment_image_path: "kawaii-content/v1/payment-methods.png",
    _cms: cms,
  };

  const pageValues = pages
    .map(
      (page) =>
        `(${sqlLiteral(page.slug)}, ${sqlLiteral(page.title)}, ${sqlLiteral(page.body_html)}, ${sqlLiteral(page.updated_at)}::timestamptz)`,
    )
    .join(",\n");
  const sectionValues = fallbackSections
    .map(
      ({ id, type, title, subtitle, body, sort, active, config }) =>
        `(${sqlLiteral(id)}::uuid, ${sqlLiteral(type)}, ${title === null ? "null" : sqlLiteral(title)}, ${subtitle === null ? "null" : sqlLiteral(subtitle)}, ${body === null ? "null" : sqlLiteral(body)}, ${sort}, ${active}, ${sqlLiteral(JSON.stringify(config))}::jsonb)`,
    )
    .join(",\n");

  await runSql(`
begin;
select pg_advisory_xact_lock(hashtext('kawaii-content-migration-v1'));
alter table public.content_pages drop constraint if exists content_pages_slug_check;
alter table public.content_pages drop constraint if exists content_pages_slug_format_check;
alter table public.content_pages add constraint content_pages_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
insert into public.content_pages (slug, title, body_html, updated_at)
values
${pageValues}
on conflict (slug) do update set title = excluded.title, body_html = excluded.body_html, updated_at = excluded.updated_at;
delete from public.banners
where id = '50000000-0000-4000-8000-000000000001';
insert into public.banners (id, section_type, title, subtitle, image_path, mobile_image_path, cta_label, cta_url, sort, active)
values
  ('51000000-0000-4000-8000-000000000001', 'banner', 'Authentic Japanese Cosmetics', 'Authentic and affordable Japanese beauty products in Bangladesh', 'kawaii-content/v1/banner-1.webp', null, 'Shop now', '/product', 10, true),
  ('51000000-0000-4000-8000-000000000002', 'banner', 'Japanese Skincare & Beauty', 'Carefully sourced products delivered nationwide', 'kawaii-content/v1/banner-2.webp', null, 'Explore products', '/product', 20, true),
  ('51000000-0000-4000-8000-000000000003', 'banner', 'Beauty Made Kawaii', 'Discover skincare, hair care, cosmetics, and personal care', 'kawaii-content/v1/banner-3.webp', null, 'View collection', '/product', 30, true)
on conflict (id) do update set
  section_type = excluded.section_type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  image_path = excluded.image_path,
  mobile_image_path = excluded.mobile_image_path,
  cta_label = excluded.cta_label,
  cta_url = excluded.cta_url,
  sort = excluded.sort,
  active = excluded.active;
insert into public.homepage_sections (id, type, title, subtitle, body, sort, active, config)
values
${sectionValues}
on conflict (id) do update set
  type = excluded.type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  sort = excluded.sort,
  active = excluded.active,
  config = excluded.config;
update public.site_settings
set store_name = 'Kawaii',
    logo_path = 'kawaii-content/v1/logo.webp',
    invoice_logo_path = 'kawaii-content/v1/invoice-logo.webp',
    favicon_path = 'kawaii-content/v1/favicon.webp',
    contact_email = 'info@kawaii.com.bd',
    contact_phone = '+880 1608-950309',
    address = 'Pallabi Extension, Mirpur, Dhaka 1216',
    currency = 'BDT',
    currency_symbol = '৳',
    shipping_flat = 60,
    free_shipping_threshold = 1500,
    socials = ${sqlLiteral(JSON.stringify(socials))}::jsonb,
    announcement_text = 'Free nationwide delivery on orders over ৳1,500',
    announcement_active = true,
    announcement_url = '/product',
    updated_at = now()
where id = 1;
create table if not exists provisioning.content_migrations (
  migration_key text primary key,
  source_url text not null,
  applied_at timestamptz not null default now()
);
insert into provisioning.content_migrations (migration_key, source_url)
values ('kawaii-wordpress-v1', ${sqlLiteral(sourceUrl)})
on conflict (migration_key) do update
set source_url = excluded.source_url,
    applied_at = now();
commit;
`);

  const migrationRows = responseRows(
    await runSql(
      "select migration_name, checksum from provisioning.schema_migrations order by migration_name",
      true,
    ),
  );
  const migrationChecksums = Object.fromEntries(
    migrationRows.map((row) => [row.migration_name, row.checksum]),
  );
  const schemaVersion = migrationRows
    .map((row) => String(row.migration_name).slice(0, 4))
    .filter((version) => /^\d{4}$/.test(version))
    .at(-1);
  if (!schemaVersion) throw new Error("Supabase migration ledger is empty");

  const clientDirectory = join(clientsDirectory, "kawaii");
  mkdirSync(clientDirectory, { recursive: true });
  const tenantPath = join(clientDirectory, "tenant.json");
  const existingTenant = existsSync(tenantPath)
    ? JSON.parse(readFileSync(tenantPath, "utf8"))
    : {};
  const tenant = {
    ...existingTenant,
    $schema: "../../../ops/schemas/tenant-manifest.schema.json",
    id: "kawaii",
    displayName: "Kawaii",
    status: existingTenant.status ?? "onboarding",
    domains: existingTenant.domains ?? { production: sourceUrl, aliases: [] },
    vercel: {
      projectName: "store-kawaii",
      rootDirectory: "frontend/website",
      productionBranch: "main",
    },
    supabase: {
      projectRef,
      url: projectUrl,
      schemaVersion,
    },
  };
  const deploymentPath = join(clientDirectory, "deployment.json");
  const existingDeployment = existsSync(deploymentPath)
    ? JSON.parse(readFileSync(deploymentPath, "utf8"))
    : {};
  const deployment = {
    ...existingDeployment,
    status: existingDeployment.status ?? "dns_pending",
    vercelProjectName: "store-kawaii",
    productionDomain: sourceUrl,
    domainAliases: existingDeployment.domainAliases ?? [],
    supabaseProjectRef: projectRef,
    supabaseUrl: projectUrl,
    schemaVersion,
    migrationChecksums,
    domainVerified: existingDeployment.domainVerified ?? false,
    sslReady: existingDeployment.sslReady ?? false,
    smokeTestsPassed: existingDeployment.smokeTestsPassed ?? false,
    trackedAt: now,
  };
  const publicEnvironment = {
    SUPABASE_URL: projectUrl,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: "",
    SUPABASE_ACCESS_TOKEN: "",
    SITE_URL: sourceUrl,
    SECURITY_ENABLED: "true",
  };
  const environmentBackup = {
    formatVersion: 2,
    purpose:
      "Non-secret environment inventory. Privileged credentials intentionally remain blank.",
    clientId: "kawaii",
    sources: {
      "frontend/website/.env.kawaii": publicEnvironment,
    },
  };
  const readme = `# Kawaii\n\nProduction storefront: ${sourceUrl}\n\nAdmin: ${sourceUrl}/admin/login\n\nVercel project: \`store-kawaii\`\n\nSupabase project: \`${projectRef}\`\n\nThe storefront content is migrated. Product, category, review, price, and inventory data will be imported separately from the owner-provided CSV.\n\nDNS verification is pending. Privileged values remain blank in \`environment.backup.json\`.\n\n## Local development\n\n\`\`\`bash\ncd frontend/website\nnpm run dev:client -- kawaii\n\`\`\`\n`;
  writeFileSync(
    tenantPath,
    `${JSON.stringify(tenant, null, 2)}\n`,
  );
  writeFileSync(
    deploymentPath,
    `${JSON.stringify(deployment, null, 2)}\n`,
  );
  writeFileSync(
    join(clientDirectory, "environment.backup.json"),
    `${JSON.stringify(environmentBackup, null, 2)}\n`,
  );
  writeFileSync(join(clientDirectory, "README.md"), readme);

  const localEnvironment = {
    SUPABASE_URL: projectUrl,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRole,
    SITE_URL: sourceUrl,
    SECURITY_ENABLED: "true",
  };
  writeFileSync(
    join(repositoryRoot, "frontend", "website", ".env.kawaii"),
    `${Object.entries(localEnvironment)
      .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
      .join("\n")}\n`,
  );
  const localSecretsDirectory = join(repositoryRoot, ".client-secrets");
  if (!existsSync(localSecretsDirectory)) {
    mkdirSync(localSecretsDirectory, { recursive: true });
  }
  writeFileSync(
    join(localSecretsDirectory, "kawaii.env"),
    `SUPABASE_ANON_KEY=${JSON.stringify(anonKey)}\nSUPABASE_SERVICE_ROLE_KEY=${JSON.stringify(serviceRole)}\nSUPABASE_ACCESS_TOKEN=${JSON.stringify(managementToken)}\n`,
  );

  const validation = responseRows(
    await runSql(
      `select
        (select count(*)::int from public.content_pages where slug in (${pages.map((page) => sqlLiteral(page.slug)).join(", ")})) as page_count,
        (select count(*)::int from public.banners where image_path like 'kawaii-content/v1/%') as banner_count,
        (select count(*)::int from public.homepage_sections) as section_count,
        (select count(*)::int from public.products) as product_count,
        (select count(*)::int from public.categories) as category_count,
        (select count(*)::int from public.reviews) as review_count,
        (select count(*)::int from storage.objects where name like 'kawaii-content/v1/%') as copied_asset_count,
        (select count(*)::int from public.content_pages where body_html ~* '<script|on[a-z]+\\s*=') as unsafe_page_count,
        (select count(*)::int from public.content_pages where body_html like '%kawaii.com.bd/wp-content/uploads/%') as old_asset_reference_count,
        (select store_name from public.site_settings where id = 1) as store_name`,
      true,
    ),
  )[0];
  console.log(JSON.stringify(validation));
}

await main();
