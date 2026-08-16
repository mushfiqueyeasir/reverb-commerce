import assert from "node:assert/strict";
import test from "node:test";
import {
  ABOUT_TYPES,
  BANNER_PATHS,
  CATEGORIES,
  CATEGORY_IDS,
  FACEBOOK_URL,
  HOMEPAGE_TYPES,
  INSTAGRAM_URL,
  MIGRATION_KEY,
  MINICO_BANNER_LABELS,
  MINICO_PRODUCT_LABELS,
  MINICO_PROMO_LABELS,
  MINICO_REVIEW_LABELS,
  TEMPLATE_PROMOTION_ID,
  THEME_CONTENT_REFERENCES,
  THEME_DESIGN_CONFIG,
  THEME_KEY,
  THEME_MANIFEST,
  THEME_RESOLVED_TOKENS,
  THEME_SCHEMA_VERSION,
  THEME_TOKEN_OVERRIDES,
  THEME_VERSION,
  buildAboutSections,
  buildApplySql,
  buildBanners,
  buildDesiredState,
  buildHomepageSections,
  buildSiteSettingsPatch,
  buildStateSql,
  compareCurrentState,
  desiredChecksum,
} from "./populate-minicobd-content.mjs";

const CANONICAL_HOMEPAGE_IDS = new Map([
  ["banner", "60000000-0000-4000-8000-000000000001"],
  ["categories", "60000000-0000-4000-8000-000000000002"],
  ["deals", "60000000-0000-4000-8000-000000000013"],
  ["new_arrivals", "60000000-0000-4000-8000-000000000014"],
  ["featured", "60000000-0000-4000-8000-000000000003"],
  ["reviews", "60000000-0000-4000-8000-000000000005"],
  ["promo", "60000000-0000-4000-8000-000000000004"],
  ["guarantees", "60000000-0000-4000-8000-000000000015"],
  ["studio_notes", "60000000-0000-4000-8000-000000000016"],
  ["richtext", "60000000-0000-4000-8000-000000000006"],
  ["banner_v2", "60000000-0000-4000-8000-000000000007"],
  ["categories_v2", "60000000-0000-4000-8000-000000000008"],
  ["featured_v2", "60000000-0000-4000-8000-000000000009"],
  ["reviews_v2", "60000000-0000-4000-8000-000000000010"],
  ["promo_v2", "60000000-0000-4000-8000-000000000011"],
  ["richtext_v2", "60000000-0000-4000-8000-000000000012"],
  ["ai_search", "60000000-0000-4000-8000-000000000017"],
]);

test("buildHomepageSections returns the canonical MiniCo sections", () => {
  const rows = buildHomepageSections();
  assert.equal(rows.length, 17);
  assert.deepEqual(
    new Set(rows.map((row) => row.type)),
    new Set(HOMEPAGE_TYPES),
  );
  assert.equal(new Set(rows.map((row) => row.id)).size, 17);
  assert.equal(rows.filter((row) => row.active).length, 11);
  assert.deepEqual(
    rows.filter((row) => row.active).map((row) => row.type),
    [
      "banner",
      "categories",
      "deals",
      "new_arrivals",
      "featured",
      "richtext",
      "reviews",
      "promo",
      "guarantees",
      "studio_notes",
      "ai_search",
    ],
  );
  assert.deepEqual(
    rows.filter((row) => row.active).map((row) => row.sort),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 16],
  );
  assert.ok(
    rows.filter((row) => row.type.endsWith("_v2")).every((row) => !row.active),
  );
  for (const row of rows)
    assert.equal(row.id, CANONICAL_HOMEPAGE_IDS.get(row.type));
  assert.deepEqual(
    rows.find((row) => row.type === "categories").config.category_ids,
    CATEGORY_IDS,
  );
  assert.equal(rows.find((row) => row.type === "categories").config.limit, 5);
  const productSections = rows.filter((row) =>
    ["deals", "new_arrivals", "featured", "featured_v2"].includes(row.type),
  );
  assert.equal(productSections.filter((row) => row.active).length, 3);
  assert.deepEqual(
    productSections.filter((row) => row.active).map((row) => row.title),
    ["Today's Best Deals", "New Arrival Products", "Featured Products"],
  );
  assert.ok(
    productSections
      .filter((row) => row.active)
      .every((row) => row.config.limit === 10),
  );
  assert.equal(rows.find((row) => row.type === "featured_v2").config.limit, 6);
  assert.equal(rows.find((row) => row.type === "reviews").config.limit, 12);
  assert.equal(rows.find((row) => row.type === "reviews_v2").config.limit, 12);
  const banner = rows.find((row) => row.type === "banner");
  assert.equal(banner.config.edit_label, MINICO_BANNER_LABELS.edit_label);
  assert.equal(banner.config.carousel_role_description, "carousel");
  assert.ok(banner.config.marquee_items.length >= 4);
  assert.equal(banner.config.stats.length, 4);
  for (const row of productSections) {
    assert.equal(
      row.config.sold_out_badge,
      MINICO_PRODUCT_LABELS.sold_out_badge,
    );
    assert.equal(
      row.config.special_price_badge,
      MINICO_PRODUCT_LABELS.special_price_badge,
    );
    assert.equal(row.config.default_badge, MINICO_PRODUCT_LABELS.default_badge);
    assert.equal(
      row.config.product_list_label,
      MINICO_PRODUCT_LABELS.product_list_label,
    );
    assert.equal(
      row.config.uncategorized_label_template,
      MINICO_PRODUCT_LABELS.uncategorized_label_template,
    );
  }
  for (const type of ["reviews", "reviews_v2"]) {
    const config = rows.find((row) => row.type === type).config;
    assert.equal(
      config.item_label_template,
      MINICO_REVIEW_LABELS.item_label_template,
    );
    assert.equal(config.verified_label, MINICO_REVIEW_LABELS.verified_label);
    assert.equal(
      config.rating_aria_template,
      MINICO_REVIEW_LABELS.rating_aria_template,
    );
  }
  const guarantees = rows.find((row) => row.type === "guarantees");
  assert.equal(guarantees.config.accessible_label, "Shopping guarantees");
  assert.equal(guarantees.config.items.length, 3);
  assert.ok(
    guarantees.config.items.every(
      (item) => item.title.trim() && item.body.trim(),
    ),
  );
  const studioNotes = rows.find((row) => row.type === "studio_notes");
  assert.equal(studioNotes.config.eyebrow, "Notes from the store");
  assert.equal(studioNotes.config.cta_label, "Join our list");
  assert.equal(studioNotes.config.cta_url, "/contact-us");
  const aiSearch = rows.find((row) => row.type === "ai_search");
  assert.equal(aiSearch.config.eyebrow, "New · AI shopping advisor");
  assert.equal(aiSearch.config.pill_label, "New");
  for (const type of ["promo", "promo_v2"]) {
    const config = rows.find((row) => row.type === type).config;
    assert.equal(config.promotion_id, TEMPLATE_PROMOTION_ID);
    assert.equal(config.kicker, MINICO_PROMO_LABELS.kicker);
    assert.equal(config.limited_label, MINICO_PROMO_LABELS.limited_label);
    assert.equal(config.discount_suffix, MINICO_PROMO_LABELS.discount_suffix);
    assert.equal(config.image_eyebrow, MINICO_PROMO_LABELS.image_eyebrow);
    assert.equal(config.image_title, MINICO_PROMO_LABELS.image_title);
    assert.equal(
      config.cta_fallback_label,
      MINICO_PROMO_LABELS.cta_fallback_label,
    );
  }
  for (const type of ["richtext", "richtext_v2"]) {
    const config = rows.find((row) => row.type === type).config;
    assert.equal(config.image_bucket, "branding");
    assert.ok(
      config.cards.every(
        (card) => card.id && card.icon && card.label && card.detail,
      ),
    );
  }
});

test("buildAboutSections keeps the MiniCo V1 sections active", () => {
  const rows = buildAboutSections();
  assert.equal(rows.length, 12);
  assert.equal(new Set(rows.map((row) => row.id)).size, 12);
  assert.deepEqual(new Set(rows.map((row) => row.type)), new Set(ABOUT_TYPES));
  assert.equal(rows.filter((row) => row.active).length, 6);
  assert.ok(
    rows.filter((row) => row.type.endsWith("_v2")).every((row) => !row.active),
  );
  const copy = JSON.stringify(rows);
  assert.match(copy, /MiniCo/);
  assert.match(copy, /Dhaka/);
  assert.match(copy, /7K\+|7,231/);
  for (const row of rows.filter((row) => row.active)) {
    assert.ok(row.title?.trim());
    assert.ok(Object.keys(row.config).length > 0);
    assert.match(JSON.stringify(row), /accessor|cover|lifestyle|MiniCo|Dhaka/i);
  }
  for (const row of rows) assert.ok(row.config.accessible_label?.trim());
  for (const type of [
    "hero",
    "story",
    "craft",
    "hero_v2",
    "story_v2",
    "craft_v2",
  ]) {
    assert.ok(
      rows.find((row) => row.type === type).config.image_alt?.trim(),
      `${type} must provide image_alt`,
    );
  }
  for (const type of ["stats", "stats_v2"]) {
    assert.ok(
      rows
        .find((row) => row.type === type)
        .config.items.every((item) => item.label.trim() && item.value.trim()),
    );
  }
  for (const type of ["values", "values_v2"]) {
    assert.ok(
      rows
        .find((row) => row.type === type)
        .config.items.every((item) => item.title.trim()),
    );
  }
  for (const type of ["craft", "craft_v2"]) {
    assert.ok(
      rows
        .find((row) => row.type === type)
        .config.items.every((item) => item.label.trim()),
    );
  }
  assert.doesNotMatch(
    copy,
    /placeholder|kawaii|beauty|cosmetic|skincare|clothing|apparel|dress|sale|discount/i,
  );
});

test("buildBanners returns three active rows for each banner version", () => {
  const rows = buildBanners();
  assert.equal(rows.length, 6);
  assert.equal(new Set(rows.map((row) => row.id)).size, 6);
  assert.equal(rows.filter((row) => row.section_type === "banner").length, 3);
  assert.equal(
    rows.filter((row) => row.section_type === "banner_v2").length,
    3,
  );
  assert.ok(rows.every((row) => row.active));
  assert.deepEqual(
    new Set(rows.map((row) => row.image_path)),
    new Set(BANNER_PATHS),
  );
});

test("categories avoid the reserved default sort position", () => {
  assert.equal(CATEGORIES.length, 3);
  assert.deepEqual(
    CATEGORIES.map((category) => category.slug),
    ["mobile-covers", "accessories", "lifestyle-essentials"],
  );
  assert.ok(CATEGORIES.every((category) => category.sort > 0));
  assert.equal(new Set(CATEGORIES.map((category) => category.id)).size, 3);
  assert.equal(CATEGORY_IDS.length, 3);
});

test("site settings patch carries the MiniCo BDT storefront", () => {
  const settings = buildSiteSettingsPatch();
  assert.equal(settings.store_name, "MiniCo.");
  assert.equal(settings.currency, "BDT");
  assert.equal(settings.currency_symbol, "৳");
  assert.equal(settings.contact_email, "support@minicobd.com");
  assert.equal(settings.address, "Dhaka, Bangladesh");
  assert.equal(settings.socials.facebook, FACEBOOK_URL);
  assert.equal(settings.socials.instagram, INSTAGRAM_URL);
  const cms = settings.socials._cms;
  assert.equal(cms.currencies.default, "BDT");
  assert.ok(cms.currencies.enabled.includes("BDT"));
  assert.deepEqual(cms.currencies.enabled, ["BDT"]);
  assert.equal(
    cms.announcement.text,
    "Free delivery across Bangladesh on orders over ৳1,000",
  );
  assert.equal(cms.navbar.items.length, 4);
  assert.ok(cms.footer.columns.length >= 3);
  assert.ok(cms.pages_seo.home?.title?.includes("MiniCo"));
});

test("desired theme matches the MiniCo volt-gear contract", () => {
  assert.equal(THEME_KEY, "volt-gear");
  assert.equal(THEME_SCHEMA_VERSION, 1);
  assert.equal(THEME_VERSION, 1);
  assert.deepEqual(THEME_MANIFEST, { id: "volt-gear", version: 1 });
  assert.deepEqual(THEME_TOKEN_OVERRIDES, {
    palette: { primary: "#660c23" },
  });
  assert.deepEqual(THEME_RESOLVED_TOKENS, {
    palette: {
      primary: "#660c23",
      primaryForeground: "#fff7f8",
      background: "#080406",
      surface: "#130b0e",
      card: "#1a0f13",
      foreground: "#f6efed",
      mutedForeground: "#a08f90",
      border: "#2f1f24",
    },
    shape: {
      radius: {
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "9999px",
      },
    },
  });
  assert.deepEqual(THEME_CONTENT_REFERENCES, {
    navbar: {
      relation: "site_settings",
      selector: { id: 1 },
      path: ["socials", "_cms", "navbar"],
    },
    footer: {
      relation: "site_settings",
      selector: { id: 1 },
      path: ["socials", "_cms", "footer"],
    },
    homepage: {
      relation: "homepage_sections",
      orderBy: ["sort", "created_at"],
    },
    about: {
      relation: "site_settings",
      selector: { id: 1 },
      path: ["socials", "_cms", "about_sections"],
    },
  });
  assert.deepEqual(THEME_DESIGN_CONFIG, {
    schemaVersion: 1,
    themeId: "volt-gear",
    themeVersion: 1,
    tokenOverrides: THEME_TOKEN_OVERRIDES,
    resolvedTokens: THEME_RESOLVED_TOKENS,
    contentReferences: THEME_CONTENT_REFERENCES,
  });
});

test("desiredChecksum is deterministic and content and theme sensitive", () => {
  const first = buildDesiredState();
  const contentChange = buildDesiredState();
  const themeChange = buildDesiredState();
  assert.equal(desiredChecksum(first), desiredChecksum(buildDesiredState()));
  assert.match(desiredChecksum(first), /^[a-f0-9]{64}$/);
  contentChange.homepageSections[0].config.description = "Changed";
  themeChange.theme.designConfig.resolvedTokens.palette.primary = "#000000";
  assert.notEqual(desiredChecksum(first), desiredChecksum(contentChange));
  assert.notEqual(desiredChecksum(first), desiredChecksum(themeChange));
});

test("state comparison includes the CMS mirrors", () => {
  const desired = buildDesiredState();
  const withoutTimestamps = (rows) =>
    rows.map(({ created_at, updated_at, ...row }) => row);
  const row = {
    theme_key: desired.theme.themeKey,
    theme_schema_version: desired.theme.schemaVersion,
    theme_manifest: desired.theme.manifest,
    theme_design_config: desired.theme.designConfig,
    theme_state_valid: true,
    theme_draft_count: 1,
    theme_published_revision_id: "published-id",
    theme_draft_source_revision_id: "published-id",
    homepage_rows: withoutTimestamps(desired.homepageSections),
    banner_rows: withoutTimestamps(desired.banners),
    about_rows: desired.aboutSections,
    cms_homepage: desired.homepageSections,
    cms_banners: desired.banners,
    promotion: desired.promotion,
    facebook: desired.facebook,
    instagram: desired.instagram,
    store_name: desired.siteSettings.store_name,
    currency: desired.siteSettings.currency,
    currency_symbol: desired.siteSettings.currency_symbol,
    storage_names: desired.bannerAssets.map(
      ({ path }) => `banner-images/${path}`,
    ),
  };
  const matching = compareCurrentState(row, desired);
  assert.deepEqual(matching.changed, []);
  row.about_rows = [];
  const changed = compareCurrentState(row, desired);
  assert.ok(changed.changed.includes("aboutRows"));
});

test("apply SQL is identity-guarded, locked, scoped, and writes CMS mirrors", () => {
  const desired = buildDesiredState();
  const sql = buildApplySql(desired, desiredChecksum(desired));
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /provisioning\.store_identity/);
  assert.match(sql, /client_id[\s\S]*'minicobd'/);
  assert.match(sql, /lock table public\.homepage_sections/);
  assert.match(sql, /lock table public\.banners/);
  assert.match(sql, /lock table public\.promotions/);
  assert.match(sql, /lock table public\.categories/);
  assert.match(sql, /lock table public\.site_settings/);
  assert.match(sql, /lock table public\.theme_state/);
  assert.match(sql, /lock table public\.theme_revisions/);
  assert.match(sql, /jsonb_set\(/);
  assert.match(sql, /'\{facebook\}'/);
  assert.match(sql, /'\{instagram\}'/);
  assert.match(
    sql,
    /'banners',[\s\S]*'homepage_sections',[\s\S]*'about_sections'/,
  );
  assert.match(sql, new RegExp(MIGRATION_KEY));
  assert.match(sql, new RegExp(FACEBOOK_URL.replaceAll(".", "\\.")));
  assert.match(sql, /insert into public\.categories/);
  assert.doesNotMatch(sql, /delete from public\.promotions/i);
});

test("apply SQL backs up content and theme before destructive writes", () => {
  const desired = buildDesiredState();
  const checksum = desiredChecksum(desired);
  const sql = buildApplySql(desired, checksum);
  const identityGuard = sql.indexOf(
    "Supabase store identity does not match MiniCo",
  );
  const backup = sql.indexOf("insert into provisioning.theme_builder_backups");
  const firstDelete = sql.indexOf("delete from public.homepage_sections");
  assert.ok(identityGuard > sql.indexOf("begin;"));
  assert.ok(backup > identityGuard);
  assert.ok(firstDelete > backup);
  assert.match(sql, new RegExp(`${MIGRATION_KEY}:${checksum}`));
  assert.match(
    sql,
    /'homepageSections'[\s\S]*'banners'[\s\S]*'cmsAbout'[\s\S]*'promotion'[\s\S]*'contentLedger'[\s\S]*'themeState'[\s\S]*'publishedTheme'[\s\S]*'draftTheme'/,
  );
  assert.match(sql, /migration_name[\s\S]*txid_current\(\)::text/);
  assert.match(sql, /MiniCo operation backup could not be verified/);
});

test("apply SQL publishes the theme atomically after content writes", () => {
  const desired = buildDesiredState();
  const sql = buildApplySql(desired, desiredChecksum(desired));
  const contentWrite = sql.indexOf("update public.site_settings");
  const ledgerWrite = sql.indexOf(
    "insert into provisioning.content_migrations",
  );
  const themeApply = sql.indexOf("perform public.apply_theme(");
  const commit = sql.lastIndexOf("commit;");
  assert.ok(contentWrite > sql.indexOf("begin;"));
  assert.ok(ledgerWrite > contentWrite);
  assert.ok(themeApply > ledgerWrite);
  assert.ok(commit > themeApply);
  assert.match(sql, /'volt-gear'/);
  assert.match(sql, /MiniCo published theme assertion failed/);
  assert.match(sql, /MiniCo theme draft assertion failed/);
  assert.match(sql, /draft\.source_revision_id/);
  assert.doesNotMatch(
    sql,
    /(?:insert into|update|delete from)\s+public\.theme_(?:revisions|state)/i,
  );
});

test("state SQL reads published theme and CMS mirror paths", () => {
  const sql = buildStateSql();
  assert.match(sql, /revision\.theme_key[\s\S]*as theme_key/);
  assert.match(sql, /as cms_homepage/);
  assert.match(sql, /as cms_banners/);
  assert.match(sql, /as about_rows/);
  assert.match(sql, /as storage_names/);
  assert.match(sql, new RegExp(MIGRATION_KEY));
});

test("replace SQL requires an existing changed checksum", () => {
  const desired = buildDesiredState();
  const sql = buildApplySql(desired, desiredChecksum(desired), {
    replace: true,
  });
  assert.match(sql, /existing_source is null or existing_source =/);
  assert.match(sql, /--replace guard requires a changed MiniCo checksum/);
});
