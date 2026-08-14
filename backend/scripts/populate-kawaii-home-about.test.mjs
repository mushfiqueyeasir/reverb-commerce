import assert from "node:assert/strict";
import test from "node:test";
import {
  ABOUT_TYPES,
  BANNER_PATHS,
  CATEGORY_IDS,
  FACEBOOK_PROFILE_PATH,
  FACEBOOK_URL,
  HOMEPAGE_TYPES,
  STORY_CLASSIC_PATH,
  STORY_EDITORIAL_PATH,
  TEMPLATE_PROMOTION_ID,
  buildAboutSections,
  buildApplySql,
  buildBanners,
  buildDesiredState,
  buildHomepageSections,
  buildProductSectionsApplySql,
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
  assert.deepEqual(new Set(rows.map((row) => row.type)), new Set(HOMEPAGE_TYPES));
  assert.equal(new Set(rows.map((row) => row.id)).size, 14);
  assert.equal(rows.filter((row) => row.active).length, 8);
  assert.ok(
    rows.filter((row) => row.type.endsWith("_v2")).every((row) => !row.active),
  );
  for (const row of rows) assert.equal(row.id, CANONICAL_HOMEPAGE_IDS.get(row.type));
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
  assert.ok(productSections.filter((row) => row.active).every((row) => row.config.limit === 4));
  assert.equal(rows.find((row) => row.type === "featured_v2").config.limit, 5);
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
  assert.doesNotMatch(
    copy,
    /placeholder|founded\s*2022|family[- ]run|direct from japan|nationwide delivery|biggest/i,
  );
});

test("buildBanners returns three active rows for each banner version", () => {
  const rows = buildBanners();
  assert.equal(rows.length, 6);
  assert.equal(new Set(rows.map((row) => row.id)).size, 6);
  assert.equal(rows.filter((row) => row.section_type === "banner").length, 3);
  assert.equal(rows.filter((row) => row.section_type === "banner_v2").length, 3);
  assert.ok(rows.every((row) => row.active));
  assert.deepEqual(new Set(rows.map((row) => row.image_path)), new Set(BANNER_PATHS));
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

test("desiredChecksum is deterministic and content-sensitive", () => {
  const first = buildDesiredState();
  const second = buildDesiredState();
  assert.equal(desiredChecksum(first), desiredChecksum(second));
  assert.match(desiredChecksum(first), /^[a-f0-9]{64}$/);
  second.homepageSections[0].config.description = "Changed";
  assert.notEqual(desiredChecksum(first), desiredChecksum(second));
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
  assert.match(sql, /where type in \(/);
  assert.match(sql, /where section_type in \('banner', 'banner_v2'\)/);
  assert.match(sql, /jsonb_set\(/);
  assert.match(sql, /'\{facebook\}'/);
  assert.match(sql, /'banners'[\s\S]*'homepage_sections'[\s\S]*'about_sections'/);
  assert.match(sql, /kawaii-home-about-v2/);
  assert.match(sql, new RegExp(FACEBOOK_URL.replaceAll(".", "\\.")));
  assert.doesNotMatch(sql, /content_pages|legal|terms|privacy|refund|VE[- ]?Gear/i);
  assert.doesNotMatch(sql, /set\s+store_name|set\s+socials\s*=\s*'\{/i);
  assert.doesNotMatch(sql, /delete from public\.promotions/i);
});

test("product section SQL is identity-guarded and preserves unrelated content", () => {
  const sql = buildProductSectionsApplySql();
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /provisioning\.store_identity/);
  assert.match(sql, /client_id[\s\S]*'kawaii'/);
  assert.match(sql, /where type in \('deals', 'new_arrivals', 'featured', 'featured_v2'\)/);
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
  const sql = buildApplySql(desired, desiredChecksum(desired), { replace: true });
  assert.match(sql, /existing_source is null or existing_source =/);
  assert.match(sql, /--replace guard requires a changed Kawaii checksum/);
});
