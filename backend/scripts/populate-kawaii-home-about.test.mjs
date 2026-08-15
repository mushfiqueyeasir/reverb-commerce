import assert from "node:assert/strict";
import test from "node:test";
import {
  ABOUT_TYPES,
  BANNER_PATHS,
  CATEGORY_IDS,
  FACEBOOK_PROFILE_PATH,
  FACEBOOK_URL,
  HOMEPAGE_TYPES,
  LEGACY_MIGRATION_KEY,
  MIGRATION_KEY,
  STORY_CLASSIC_PATH,
  STORY_EDITORIAL_PATH,
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
  buildProductSectionsApplySql,
  buildStateSql,
  compareCurrentState,
  desiredChecksum,
} from "./populate-kawaii-home-about.mjs";

const CANONICAL_HOMEPAGE_IDS = new Map([
  ["banner", "60000000-0000-4000-8000-000000000001"],
  ["categories", "60000000-0000-4000-8000-000000000002"],
  ["deals", "60000000-0000-4000-8000-000000000013"],
  ["new_arrivals", "60000000-0000-4000-8000-000000000014"],
  ["featured", "60000000-0000-4000-8000-000000000003"],
  ["reviews", "60000000-0000-4000-8000-000000000005"],
  ["promo", "60000000-0000-4000-8000-000000000004"],
  ["richtext", "60000000-0000-4000-8000-000000000006"],
  ["banner_v2", "60000000-0000-4000-8000-000000000007"],
  ["categories_v2", "60000000-0000-4000-8000-000000000008"],
  ["featured_v2", "60000000-0000-4000-8000-000000000009"],
  ["reviews_v2", "60000000-0000-4000-8000-000000000010"],
  ["promo_v2", "60000000-0000-4000-8000-000000000011"],
  ["richtext_v2", "60000000-0000-4000-8000-000000000012"],
]);

test("buildHomepageSections returns the canonical Kawaii sections", () => {
  const rows = buildHomepageSections();
  assert.equal(rows.length, 14);
  assert.deepEqual(
    new Set(rows.map((row) => row.type)),
    new Set(HOMEPAGE_TYPES),
  );
  assert.equal(new Set(rows.map((row) => row.id)).size, 14);
  assert.equal(rows.filter((row) => row.active).length, 8);
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
    ],
  );
  assert.deepEqual(
    rows.filter((row) => row.active).map((row) => row.sort),
    [0, 1, 2, 3, 4, 5, 6, 7],
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
      .every((row) => row.config.limit === 8),
  );
  assert.equal(rows.find((row) => row.type === "featured_v2").config.limit, 6);
  assert.equal(rows.find((row) => row.type === "reviews").config.limit, 12);
  assert.equal(rows.find((row) => row.type === "reviews_v2").config.limit, 12);
  for (const type of ["promo", "promo_v2"]) {
    assert.equal(
      rows.find((row) => row.type === type).config.promotion_id,
      TEMPLATE_PROMOTION_ID,
    );
  }
});

test("buildAboutSections keeps the Kawaii V1 sections active", () => {
  const rows = buildAboutSections();
  assert.equal(rows.length, 12);
  assert.equal(new Set(rows.map((row) => row.id)).size, 12);
  assert.deepEqual(new Set(rows.map((row) => row.type)), new Set(ABOUT_TYPES));
  assert.equal(rows.filter((row) => row.active).length, 6);
  assert.ok(
    rows.filter((row) => row.type.endsWith("_v2")).every((row) => !row.active),
  );
  const copy = JSON.stringify(rows);
  assert.match(copy, /Kawaii/);
  assert.match(copy, /Dhaka/);
  assert.match(copy, /88K\+|88,594/);
  for (const row of rows.filter((row) => row.active)) {
    assert.ok(row.title?.trim());
    assert.ok(Object.keys(row.config).length > 0);
    assert.match(JSON.stringify(row), /beauty|cosmetic|skincare|Kawaii/i);
  }
  assert.doesNotMatch(
    copy,
    /placeholder|founded\s*2022|family[- ]run|direct from japan|nationwide delivery|biggest|clothing|apparel|dress/i,
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

test("Story sections use dedicated images and About craft uses the Facebook profile", () => {
  const homepage = buildHomepageSections().filter((row) =>
    ["richtext", "richtext_v2"].includes(row.type),
  );
  const classic = homepage.find((row) => row.type === "richtext");
  const editorial = homepage.find((row) => row.type === "richtext_v2");
  assert.equal(classic.config.image_path, STORY_CLASSIC_PATH);
  assert.equal(classic.config.layout, "feature");
  assert.equal(editorial.config.image_path, STORY_EDITORIAL_PATH);
  for (const row of homepage) {
    assert.equal(row.config.image_bucket, "branding");
    assert.ok(
      row.config.cards.every(
        (card) => card.id && card.icon && card.label && card.detail,
      ),
    );
  }
  const craft = buildAboutSections().filter((row) =>
    ["craft", "craft_v2"].includes(row.type),
  );
  for (const row of craft) {
    assert.equal(row.config.image_path, FACEBOOK_PROFILE_PATH);
    assert.equal(row.config.image_bucket, "branding");
  }
});

test("desired theme matches the Kawaii frontend contract", () => {
  assert.equal(THEME_KEY, "kawaii-fashion");
  assert.equal(THEME_SCHEMA_VERSION, 1);
  assert.equal(THEME_VERSION, 1);
  assert.deepEqual(THEME_MANIFEST, { id: "kawaii-fashion", version: 1 });
  assert.deepEqual(THEME_TOKEN_OVERRIDES, {});
  assert.deepEqual(THEME_RESOLVED_TOKENS, {
    palette: {
      primary: "#f9287a",
      primaryForeground: "#050505",
      background: "#ffffff",
      surface: "#fff5f8",
      card: "#ffffff",
      foreground: "#241018",
      mutedForeground: "#73545f",
      border: "#f2d9e2",
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
    themeId: "kawaii-fashion",
    themeVersion: 1,
    tokenOverrides: {},
    resolvedTokens: THEME_RESOLVED_TOKENS,
    contentReferences: THEME_CONTENT_REFERENCES,
  });
  assert.deepEqual(buildDesiredState().theme, {
    themeKey: "kawaii-fashion",
    schemaVersion: 1,
    themeVersion: 1,
    manifest: THEME_MANIFEST,
    designConfig: THEME_DESIGN_CONFIG,
  });
});

test("state comparison includes published theme and draft invariants", () => {
  const desired = buildDesiredState();
  const row = {
    theme_key: desired.theme.themeKey,
    theme_schema_version: desired.theme.schemaVersion,
    theme_manifest: desired.theme.manifest,
    theme_design_config: desired.theme.designConfig,
    theme_state_valid: true,
    theme_draft_count: 1,
    theme_published_revision_id: "published-id",
    theme_draft_source_revision_id: "published-id",
    theme_draft_version: 7,
  };
  const matching = compareCurrentState(row, desired);
  assert.equal(matching.changed.includes("theme"), false);
  assert.equal(matching.changed.includes("themeState"), false);
  assert.equal(matching.changed.includes("themeDraft"), false);
  assert.equal(matching.theme.matches, true);
  assert.equal(matching.theme.draftVersion, 7);
  row.theme_key = "legacy-classic";
  const changed = compareCurrentState(row, desired);
  assert.equal(changed.changed.includes("theme"), true);
  assert.equal(changed.theme.matches, false);
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

test("promotion is evergreen and carries no sale fields", () => {
  const promotion = buildDesiredState().promotion;
  assert.equal(promotion.image_path, null);
  assert.equal(promotion.discount_percent, null);
  assert.equal(promotion.cta_url, "/product");
  assert.doesNotMatch(
    `${promotion.title} ${promotion.description} ${promotion.cta_label}`,
    /placeholder|sale|discount|offer/i,
  );
});

test("apply SQL is identity-guarded, locked, scoped, and targeted", () => {
  const desired = buildDesiredState();
  const sql = buildApplySql(desired, desiredChecksum(desired));
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /provisioning\.store_identity/);
  assert.match(sql, /client_id[\s\S]*'kawaii'/);
  assert.match(sql, /lock table public\.homepage_sections/);
  assert.match(sql, /lock table public\.banners/);
  assert.match(sql, /lock table public\.promotions/);
  assert.match(sql, /lock table public\.site_settings/);
  assert.match(sql, /lock table public\.theme_state/);
  assert.match(sql, /lock table public\.theme_revisions/);
  assert.match(sql, /where type in \(/);
  assert.match(sql, /where section_type in \('banner', 'banner_v2'\)/);
  assert.match(sql, /jsonb_set\(/);
  assert.match(sql, /'\{facebook\}'/);
  assert.match(
    sql,
    /'banners'[\s\S]*'homepage_sections'[\s\S]*'about_sections'/,
  );
  assert.match(sql, new RegExp(MIGRATION_KEY));
  assert.match(sql, new RegExp(LEGACY_MIGRATION_KEY));
  assert.match(sql, new RegExp(FACEBOOK_URL.replaceAll(".", "\\.")));
  assert.doesNotMatch(
    sql,
    /content_pages|legal|terms|privacy|refund|VE[- ]?Gear/i,
  );
  assert.doesNotMatch(sql, /set\s+store_name|set\s+socials\s*=\s*'\{/i);
  assert.doesNotMatch(sql, /delete from public\.promotions/i);
});

test("apply SQL backs up content and theme before destructive writes", () => {
  const desired = buildDesiredState();
  const checksum = desiredChecksum(desired);
  const sql = buildApplySql(desired, checksum);
  const identityGuard = sql.indexOf(
    "Supabase store identity does not match Kawaii",
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
  assert.doesNotMatch(sql, /on conflict \(migration_name\) do nothing/);
  assert.match(sql, /Kawaii operation backup could not be verified/);
});

test("apply SQL publishes the theme atomically after content writes", () => {
  const desired = buildDesiredState();
  const sql = buildApplySql(desired, desiredChecksum(desired));
  const contentWrite = sql.indexOf("update public.site_settings");
  const ledgerWrite = sql.indexOf(
    "insert into provisioning.content_migrations",
  );
  const themeApply = sql.indexOf("perform public.apply_theme(");
  const themeRevisionsLock = sql.indexOf("lock table public.theme_revisions");
  const themeStateLock = sql.indexOf("lock table public.theme_state");
  const settingsLock = sql.indexOf("lock table public.site_settings");
  const commit = sql.lastIndexOf("commit;");
  assert.ok(contentWrite > sql.indexOf("begin;"));
  assert.ok(ledgerWrite > contentWrite);
  assert.ok(themeApply > ledgerWrite);
  assert.ok(themeRevisionsLock < themeStateLock);
  assert.ok(themeStateLock < settingsLock);
  assert.ok(commit > themeApply);
  assert.match(
    sql,
    /select[\s\S]*revision\.version,[\s\S]*draft_matches[\s\S]*for update of revision/,
  );
  assert.match(
    sql,
    /if not coalesce\(published_matches, false\)[\s\S]*or not coalesce\(draft_matches, false\)/,
  );
  assert.match(
    sql,
    /'kawaii-fashion'[\s\S]*\{\"id\":\"kawaii-fashion\",\"version\":1\}/,
  );
  assert.match(sql, /Kawaii published theme assertion failed/);
  assert.match(sql, /Kawaii theme draft assertion failed/);
  assert.match(sql, /cta_url is distinct from/);
  assert.match(sql, /cta_label is distinct from/);
  assert.match(sql, /starts_at is distinct from null/);
  assert.match(sql, /ends_at is distinct from null/);
  assert.match(sql, /draft\.source_revision_id/);
  assert.doesNotMatch(
    sql,
    /(?:insert into|update|delete from)\s+public\.theme_(?:revisions|state)/i,
  );
});

test("state SQL reads published theme and singleton draft metadata", () => {
  const sql = buildStateSql();
  assert.match(sql, /revision\.theme_key[\s\S]*as theme_key/);
  assert.match(sql, /revision\.schema_version[\s\S]*as theme_schema_version/);
  assert.match(sql, /revision\.manifest[\s\S]*as theme_manifest/);
  assert.match(sql, /revision\.design_config[\s\S]*as theme_design_config/);
  assert.match(sql, /theme_draft_source_revision_id/);
  assert.match(sql, /theme_state_valid/);
  assert.match(sql, new RegExp(MIGRATION_KEY));
});

test("product section SQL is identity-guarded and preserves unrelated content", () => {
  const sql = buildProductSectionsApplySql();
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /provisioning\.store_identity/);
  assert.match(sql, /client_id[\s\S]*'kawaii'/);
  assert.match(
    sql,
    /where type in \('deals', 'new_arrivals', 'featured', 'featured_v2'\)/,
  );
  assert.match(sql, /Today''s Best Deals/);
  assert.match(sql, /New Arrival Products/);
  assert.match(sql, /Featured Products/);
  assert.match(sql, /row_number\(\) over/);
  assert.doesNotMatch(sql, /set sort = positions\.sort/);
  assert.match(sql, /jsonb_agg\(to_jsonb\(section\)/);
  assert.doesNotMatch(sql, /delete from public\.banners/);
  assert.doesNotMatch(sql, /delete from public\.promotions/);
  assert.doesNotMatch(sql, /about_sections/);
});

test("replace SQL requires an existing changed checksum", () => {
  const desired = buildDesiredState();
  const sql = buildApplySql(desired, desiredChecksum(desired), {
    replace: true,
  });
  assert.match(sql, /existing_source is null or existing_source =/);
  assert.match(sql, /--replace guard requires a changed Kawaii checksum/);
});
