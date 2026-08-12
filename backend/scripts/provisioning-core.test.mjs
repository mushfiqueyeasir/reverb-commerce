import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPlaceholderAssets,
  deriveStoreDefaults,
  normalizeHttpsUrl,
  renderSqlTemplate,
  sqlLiteral,
  validateClientId,
} from "./provisioning-core.mjs";

test("validates and normalizes provisioning identifiers", () => {
  assert.equal(validateClientId("sample-store"), "sample-store");
  assert.throws(() => validateClientId("Sample Store"));
  assert.equal(
    normalizeHttpsUrl("https://WWW.Example.com", "SITE_URL"),
    "https://www.example.com",
  );
  assert.throws(() => normalizeHttpsUrl("http://example.com", "SITE_URL"));
  assert.throws(() =>
    normalizeHttpsUrl("https://example.com/path", "SITE_URL"),
  );
});

test("derives store identity and aliases from one domain", () => {
  assert.deepEqual(deriveStoreDefaults("https://www.sample-store.com"), {
    clientId: "sample-store",
    displayName: "Sample Store",
    aliasUrl: "https://sample-store.com",
    contactEmail: "support@sample-store.com",
  });
  assert.deepEqual(deriveStoreDefaults("https://sample-store.com"), {
    clientId: "sample-store",
    displayName: "Sample Store",
    aliasUrl: "https://www.sample-store.com",
    contactEmail: "support@sample-store.com",
  });
  assert.equal(
    deriveStoreDefaults("https://www.sample-store.com", () => true).clientId,
    "sample-store-com",
  );
});

test("renders SQL values as escaped literals", () => {
  assert.equal(sqlLiteral("Merchant's Store"), "'Merchant''s Store'");
  assert.equal(
    renderSqlTemplate("select __STORE_NAME__;", {
      STORE_NAME: "Merchant's Store",
    }),
    "select 'Merchant''s Store';",
  );
  assert.throws(() => renderSqlTemplate("select __MISSING__;", {}));
  assert.equal(
    renderSqlTemplate("select __STORE_NAME__, __CONTACT_EMAIL__;", {
      STORE_NAME: "__CONTACT_EMAIL__'; drop table users; --",
      CONTACT_EMAIL: "safe@example.com",
    }),
    "select '__CONTACT_EMAIL__''; drop table users; --', 'safe@example.com';",
  );
});

test("generates deterministic PNG placeholder inventory", () => {
  const assets = buildPlaceholderAssets();
  assert.equal(assets.length, 14);
  assert.equal(
    assets[0].content.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
  );
  assert.equal(
    new Set(assets.map((asset) => `${asset.bucket}/${asset.path}`)).size,
    assets.length,
  );
});

test("renders the complete store seed without psql directives", () => {
  const template = readFileSync(
    join(import.meta.dirname, "..", "supabase", "seeds", "store-template.sql"),
    "utf8",
  );
  const rendered = renderSqlTemplate(template, {
    STORE_NAME: "Sample Store",
    CONTACT_EMAIL: "support@example.invalid",
    CONTACT_PHONE: "",
    STORE_ADDRESS: "",
    CURRENCY: "BDT",
    CURRENCY_SYMBOL: "BDT",
    SHIPPING_FLAT: "80",
    FREE_SHIPPING_THRESHOLD: "1000",
  });
  assert.doesNotMatch(rendered, /__[A-Z][A-Z0-9_]*__/);
  assert.doesNotMatch(rendered, /^\\(?:set|if|endif)/m);
  assert.match(rendered, /^begin;/m);
  assert.match(rendered, /^commit;/m);

  const jsonBanners = rendered.match(
    /'banners', jsonb_build_array\(([\s\S]*?)\n      \),\n      'homepage_sections'/,
  )?.[1];
  const jsonHomepage = rendered.match(
    /'homepage_sections', jsonb_build_array\(([\s\S]*?)\n      \),\n      'about_sections'/,
  )?.[1];
  const jsonAbout = rendered.match(
    /'about_sections', jsonb_build_array\(([\s\S]*?)\n      \),\n      'pages'/,
  )?.[1];
  const tableBanners = rendered.match(
    /insert into public\.banners \(([\s\S]*?)\n-- Remove the generated migration layout/,
  )?.[1];
  const tableHomepage = rendered.match(
    /insert into public\.homepage_sections \(([\s\S]*?)\ninsert into public\.promotions/,
  )?.[1];
  const v2Types = [
    "banner_v2",
    "categories_v2",
    "featured_v2",
    "reviews_v2",
    "promo_v2",
    "richtext_v2",
  ];
  const aboutV2Types = [
    "hero_v2",
    "stats_v2",
    "story_v2",
    "values_v2",
    "craft_v2",
    "cta_v2",
  ];

  assert.ok(jsonBanners);
  assert.ok(jsonHomepage);
  assert.ok(jsonAbout);
  assert.ok(tableBanners);
  assert.ok(tableHomepage);
  assert.equal(
    [...jsonHomepage.matchAll(/jsonb_build_object\('id', '60000000/g)].length,
    12,
  );
  assert.equal(
    [...tableHomepage.matchAll(/^  \('60000000-0000-4000-8000-/gm)].length,
    12,
  );
  for (const type of v2Types) {
    assert.match(
      jsonHomepage,
      new RegExp(`'type', '${type}'[^\\n]*'active', false`),
    );
    assert.match(tableHomepage, new RegExp(`'${type}'[^\\n]*, false,`));
  }
  assert.equal(
    [...jsonAbout.matchAll(/jsonb_build_object\('id', 'about-/g)].length,
    12,
  );
  for (const type of aboutV2Types) {
    assert.match(
      jsonAbout,
      new RegExp(`'type', '${type}'[^\\n]*'active', false`),
    );
  }
  assert.match(jsonBanners, /'section_type', 'banner'/);
  assert.doesNotMatch(jsonBanners, /banner_v2/);
  assert.match(tableBanners, /id, section_type,[\s\S]*?'banner',/);
  assert.doesNotMatch(tableBanners, /banner_v2/);
});

test("defines an idempotent disabled homepage V2 migration", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0025_homepage_section_v2.sql",
    ),
    "utf8",
  );
  const v2Types = [
    "banner_v2",
    "categories_v2",
    "featured_v2",
    "reviews_v2",
    "promo_v2",
    "richtext_v2",
  ];

  for (const type of v2Types) {
    assert.equal(
      [...migration.matchAll(new RegExp(`'${type}'`, "g"))].length,
      2,
    );
  }
  assert.match(migration, /where existing\.type = section_defaults\.type/);
  assert.match(
    migration,
    /sort_base\.max_sort \+ ordered_defaults\.missing_position/,
  );
  assert.match(migration, /ordered_defaults\.active/);
  assert.equal(
    [...migration.matchAll(/'60000000-0000-4000-8000-/g)].length,
    12,
  );
});

test("backfills and constrains banner section ownership", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0026_banner_section_discriminator.sql",
    ),
    "utf8",
  );

  assert.match(migration, /set section_type = 'banner'/);
  assert.match(migration, /section_type in \('banner', 'banner_v2'\)/);
  assert.match(migration, /alter column section_type set not null/);
  assert.match(migration, /on public\.banners \(section_type, active, sort\)/);
  assert.doesNotMatch(migration, /insert into public\.banners/);
});
