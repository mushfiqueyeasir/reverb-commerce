import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  assertMigrationStoreIdentity,
  buildPlaceholderAssets,
  createSupabaseFetch,
  deriveStoreDefaults,
  normalizeHttpsUrl,
  renderSqlTemplate,
  sqlLiteral,
  validateClientId,
} from "./provisioning-core.mjs";

function captureFetch(responseBody = null) {
  const requests = [];
  const fetchImplementation = async (input, init) => {
    requests.push(new Request(input, init));
    return new Response(
      responseBody === null ? null : JSON.stringify(responseBody),
      {
        status: 200,
        headers:
          responseBody === null ? {} : { "Content-Type": "application/json" },
      },
    );
  };
  return { fetchImplementation, requests };
}

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

test("requires the selected client to match the migration store identity", () => {
  assert.equal(
    assertMigrationStoreIdentity("sample-store", "sample-store"),
    "sample-store",
  );
  assert.throws(
    () => assertMigrationStoreIdentity("other-store", "sample-store"),
    /does not match selected client/,
  );
  assert.throws(
    () => assertMigrationStoreIdentity(null, "sample-store"),
    /provisioning identity is missing/,
  );
  assert.equal(
    assertMigrationStoreIdentity(null, "sample-store", {
      allowMissing: true,
    }),
    null,
  );
});

test("removes only modern Supabase API key bearer fallbacks", async () => {
  for (const apiKey of ["sb_publishable_public", "sb_secret_private"]) {
    const { fetchImplementation, requests } = captureFetch();
    const supabaseFetch = createSupabaseFetch(apiKey, fetchImplementation);
    await supabaseFetch("https://example.supabase.co/rest/v1/items", {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    });
    assert.equal(requests[0].headers.get("apikey"), apiKey);
    assert.equal(requests[0].headers.get("authorization"), null);
  }

  const { fetchImplementation, requests } = captureFetch();
  const supabaseFetch = createSupabaseFetch(
    "sb_publishable_public",
    fetchImplementation,
  );
  await supabaseFetch("https://example.supabase.co/auth/v1/user", {
    headers: {
      apikey: "sb_publishable_public",
      Authorization: "Bearer user.jwt.token",
    },
  });
  assert.equal(
    requests[0].headers.get("authorization"),
    "Bearer user.jwt.token",
  );

  const legacyKey = "header.payload.signature";
  const legacy = captureFetch();
  await createSupabaseFetch(legacyKey, legacy.fetchImplementation)(
    "https://example.supabase.co/rest/v1/items",
    {
      headers: {
        apikey: legacyKey,
        Authorization: `Bearer ${legacyKey}`,
      },
    },
  );
  assert.equal(
    legacy.requests[0].headers.get("authorization"),
    `Bearer ${legacyKey}`,
  );
});

test("uses modern secret keys for Supabase storage without a bearer", async () => {
  const secretKey = "sb_secret_private";
  const { fetchImplementation, requests } = captureFetch({
    Key: "branding/store-template/v1/logo.png",
  });
  const supabase = createClient("https://example.supabase.co", secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createSupabaseFetch(secretKey, fetchImplementation) },
  });

  const { error } = await supabase.storage
    .from("branding")
    .upload("store-template/v1/logo.png", Buffer.from("png"), {
      contentType: "image/png",
      upsert: true,
    });

  assert.equal(error, null);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].headers.get("apikey"), secretKey);
  assert.equal(requests[0].headers.get("authorization"), null);
  assert.equal(requests[0].headers.get("x-upsert"), "true");
});

test("uses modern project keys across Supabase Auth and PostgREST", async () => {
  const requests = [];
  const fetchImplementation = async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    const url = new URL(request.url);
    if (url.pathname === "/auth/v1/token") {
      return Response.json({
        access_token: "user.jwt.token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "refresh-token",
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          aud: "authenticated",
          role: "authenticated",
          email: "admin@example.com",
          app_metadata: {},
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
        },
      });
    }
    if (url.pathname === "/auth/v1/admin/users") {
      return Response.json({ users: [], aud: "authenticated" });
    }
    if (url.pathname === "/auth/v1/logout") {
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/rest/v1/profiles") {
      return Response.json({
        id: "00000000-0000-4000-8000-000000000001",
        role: "admin",
      });
    }
    return Response.json({ message: "unexpected request" }, { status: 500 });
  };

  const secretKey = "sb_secret_private";
  const admin = createClient("https://example.supabase.co", secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createSupabaseFetch(secretKey, fetchImplementation) },
  });
  const { error: adminError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  assert.equal(adminError, null);

  const publishableKey = "sb_publishable_public";
  const publicClient = createClient(
    "https://example.supabase.co",
    publishableKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: createSupabaseFetch(publishableKey, fetchImplementation),
      },
    },
  );
  const { error: signInError } = await publicClient.auth.signInWithPassword({
    email: "admin@example.com",
    password: "example-password",
  });
  assert.equal(signInError, null);
  const { data: profile, error: profileError } = await publicClient
    .from("profiles")
    .select("id, role")
    .maybeSingle();
  assert.equal(profileError, null);
  assert.equal(profile?.role, "admin");
  const { error: signOutError } = await publicClient.auth.signOut();
  assert.equal(signOutError, null);

  const adminRequest = requests.find((request) =>
    request.url.includes("/auth/v1/admin/users"),
  );
  const signInRequest = requests.find((request) =>
    request.url.includes("/auth/v1/token"),
  );
  const profileRequest = requests.find((request) =>
    request.url.includes("/rest/v1/profiles"),
  );
  const signOutRequest = requests.find((request) =>
    request.url.includes("/auth/v1/logout"),
  );
  assert.equal(adminRequest?.headers.get("apikey"), secretKey);
  assert.equal(adminRequest?.headers.get("authorization"), null);
  assert.equal(signInRequest?.headers.get("apikey"), publishableKey);
  assert.equal(signInRequest?.headers.get("authorization"), null);
  assert.equal(
    profileRequest?.headers.get("authorization"),
    "Bearer user.jwt.token",
  );
  assert.equal(
    signOutRequest?.headers.get("authorization"),
    "Bearer user.jwt.token",
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
    16,
  );
  assert.equal(
    [...tableHomepage.matchAll(/^  \('60000000-0000-4000-8000-/gm)].length,
    16,
  );
  for (const type of [
    ...v2Types,
    "deals",
    "new_arrivals",
    "guarantees",
    "studio_notes",
  ]) {
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
  assert.match(
    rendered,
    /'navbar', jsonb_build_object\([\s\S]*?'announcement', jsonb_build_object\('text', 'Welcome to our new store', 'active', true, 'url', '\/product'\)/,
  );
  assert.match(
    template,
    /'navbar', jsonb_build_object\([\s\S]*?'copy', jsonb_build_object\([\s\S]*?'shopAllTemplate', 'Shop all \{label\}'/,
  );
  assert.match(
    template,
    /'productCardCopy', jsonb_build_object\([\s\S]*?'quickAddButtonLabel', 'Quick Add'/,
  );
  assert.match(
    rendered,
    /'footer', jsonb_build_object\([\s\S]*?'copyrightTemplate', '© \{year\} \{storeName\}'/,
  );
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

test("defines filtered homepage product section types", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0032_filtered_homepage_product_sections.sql",
    ),
    "utf8",
  );

  for (const type of ["deals", "new_arrivals"]) {
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
  assert.match(migration, /\n  false,\n  ordered_defaults\.config/);
  assert.equal([...migration.matchAll(/'60000000-0000-4000-8000-/g)].length, 2);
});

test("defines idempotent disabled homepage support sections", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0042_homepage_support_sections.sql",
    ),
    "utf8",
  );

  for (const type of ["guarantees", "studio_notes"]) {
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
  assert.match(migration, /\n  false,\n  ordered_defaults\.config/);
  assert.equal([...migration.matchAll(/'60000000-0000-4000-8000-/g)].length, 2);
});

test("keeps provisioning credentials in GitHub environment secrets", () => {
  const workflow = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "..",
      ".github",
      "workflows",
      "deploy-new-customer.yml",
    ),
    "utf8",
  );
  assert.doesNotMatch(workflow, /^\s+supabase_access_token:/m);
  assert.match(workflow, /^\s+subscription_tracker_project_id:/m);
  assert.match(workflow, /^\s+provision_mode:/m);
  assert.match(workflow, /^\s+supabase_project_ref:/m);
  assert.match(
    workflow,
    /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/,
  );
  assert.match(
    workflow,
    /SUBSCRIPTION_TRACKER_PROJECT_ID: \$\{\{ inputs\.subscription_tracker_project_id \}\}/,
  );
  assert.match(workflow, /PROVISION_MODE: \$\{\{ inputs\.provision_mode \}\}/);
  assert.match(
    workflow,
    /SUPABASE_PROJECT_REF: \$\{\{ inputs\.supabase_project_ref \}\}/,
  );
  assert.doesNotMatch(workflow, /SUPABASE_ORG_SLUG:/);
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

test("courier settings save supports service role and no active provider", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0031_service_role_courier_settings.sql",
    ),
    "utf8",
  );

  assert.match(migration, /auth\.role\(\) <> 'service_role'/);
  assert.match(
    migration,
    /coalesce\(item_provider = p_active_provider, false\)/,
  );
  assert.match(
    migration,
    /grant execute on function public\.save_courier_settings\(jsonb, text\) to service_role/,
  );
});

test("removes product vector search infrastructure", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0036_remove_ai_vector_search.sql",
    ),
    "utf8",
  );

  assert.match(migration, /drop table if exists public\.product_embeddings/);
  assert.match(
    migration,
    /drop function if exists public\.match_product_embeddings/,
  );
  assert.match(migration, /drop extension if exists vector/);
});

test("defines a revisioned theme builder with referenced legacy content", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0040_theme_builder_foundation.sql",
    ),
    "utf8",
  );

  assert.doesNotMatch(migration, /--/);
  assert.match(
    migration,
    /create table if not exists provisioning\.theme_builder_backups/,
  );
  assert.match(
    migration,
    /'siteSettings'[\s\S]*'homepageSections'[\s\S]*'banners'/,
  );
  assert.match(migration, /create table public\.theme_revisions/);
  assert.match(migration, /create table public\.theme_state/);
  assert.match(
    migration,
    /create unique index theme_revisions_single_draft_idx[\s\S]*where status = 'draft'/,
  );
  assert.match(migration, /published theme revisions are immutable/);
  assert.match(
    migration,
    /after insert or update or delete on public\.theme_revisions\n  deferrable initially deferred/,
  );
  assert.match(
    migration,
    /after insert or update or delete on public\.theme_state\n  deferrable initially deferred/,
  );
  assert.match(migration, /'legacy-classic'/);
  assert.match(migration, /'legacy-classic',\n    1,/);
  assert.match(migration, /settings\.socials #> '\{_cms,palette\}'/);
  assert.match(migration, /'contentReferences'/);
  assert.match(
    migration,
    /'navbar'[\s\S]*'relation', 'site_settings'[\s\S]*'socials', '_cms', 'navbar'/,
  );
  assert.match(
    migration,
    /'footer'[\s\S]*'relation', 'site_settings'[\s\S]*'socials', '_cms', 'footer'/,
  );
  assert.match(migration, /'homepage'[\s\S]*'relation', 'homepage_sections'/);
});

test("restricts theme writes to atomic optimistic admin RPCs", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0040_theme_builder_foundation.sql",
    ),
    "utf8",
  );

  for (const rpc of [
    "save_theme_draft",
    "publish_theme_draft",
    "rollback_theme_revision",
  ]) {
    assert.match(
      migration,
      new RegExp(
        `create or replace function public\\.${rpc}\\([\\s\\S]*?security definer[\\s\\S]*?set search_path = public`,
      ),
    );
  }
  assert.equal([...migration.matchAll(/auth\.uid\(\)/g)].length >= 4, true);
  assert.equal([...migration.matchAll(/not public\.is_admin\(\)/g)].length, 3);
  assert.equal([...migration.matchAll(/errcode = '40001'/g)].length, 3);
  assert.equal(
    [
      ...migration.matchAll(
        /v_published\.design_config #> '\{resolvedTokens,palette\}'/g,
      ),
    ].length,
    2,
  );
  assert.match(
    migration,
    /rollback requires a historical published revision[\s\S]*insert into public\.theme_revisions/,
  );
  assert.match(
    migration,
    /revoke all on table public\.theme_revisions from public, anon, authenticated, service_role/,
  );
  assert.match(
    migration,
    /grant execute on function public\.save_theme_draft\(bigint, text, integer, jsonb, jsonb\) to authenticated, service_role/,
  );
  assert.match(migration, /notify pgrst, 'reload schema'/);
});

test("applies themes atomically through one RPC", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0041_atomic_theme_apply.sql",
    ),
    "utf8",
  );

  assert.doesNotMatch(migration, /--/);
  assert.match(
    migration,
    /create or replace function public\.apply_theme\([\s\S]*security definer[\s\S]*set search_path = public/,
  );
  assert.match(migration, /public\.save_theme_draft\(/);
  assert.match(migration, /public\.publish_theme_draft\(v_draft_version\)/);
  assert.match(
    migration,
    /grant execute on function public\.apply_theme\(bigint, text, integer, jsonb, jsonb\)[\s\S]*to authenticated, service_role/,
  );
});

test("backfills navbar announcement without replacing existing navbar config", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0043_navbar_announcement_config.sql",
    ),
    "utf8",
  );

  assert.doesNotMatch(migration, /--/);
  assert.match(migration, /settings\.announcement_text/);
  assert.match(migration, /settings\.announcement_active/);
  assert.match(migration, /settings\.announcement_url/);
  assert.match(migration, /source\.navbar \|\| jsonb_build_object\(/);
  assert.match(migration, /and not source\.navbar \? 'announcement'/);
  assert.doesNotMatch(migration, /updated_at/);
});

test("keeps existing Kawaii chrome while bootstrapping copy", () => {
  const script = readFileSync(
    join(import.meta.dirname, "migrate-kawaii-content.mjs"),
    "utf8",
  );

  assert.match(script, /\.\.\.\(existingCms\.navbar/);
  assert.match(script, /\.\.\.KAWAII_NAVBAR_COPY/);
  assert.match(script, /\.\.\.\(existingCms\.navbar\?\.copy/);
  assert.match(script, /\.\.\.KAWAII_PRODUCT_CARD_COPY/);
  assert.match(script, /\.\.\.\(existingCms\.navbar\?\.productCardCopy/);
  assert.match(script, /\.\.\.\(existingCms\.footer/);
  assert.match(script, /\.\.\.KAWAII_FOOTER_COPY/);
  assert.match(script, /\.\.\.\(existingCms\.footer\?\.copy/);
});

test("backfills Kawaii chrome copy without replacing merchant values", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0044_kawaii_chrome_copy_config.sql",
    ),
    "utf8",
  );

  assert.doesNotMatch(migration, /--/);
  assert.match(migration, /defaults\.navbar_copy \|\| source\.navbar_copy/);
  assert.match(
    migration,
    /defaults\.product_card_copy \|\| source\.product_card_copy/,
  );
  assert.match(migration, /defaults\.footer_copy \|\| source\.footer_copy/);
  assert.match(migration, /source\.navbar \|\| jsonb_build_object/);
  assert.match(migration, /source\.footer \|\| jsonb_build_object/);
  assert.doesNotMatch(migration, /updated_at/);
});

test("checks migration store identity before schema reconciliation", () => {
  const script = readFileSync(
    join(import.meta.dirname, "migrate-client.mjs"),
    "utf8",
  );
  const identityCheck = script.indexOf("assertMigrationStoreIdentity(");
  const adoptionWrite = script.indexOf("const bindingSql =");
  const migrationWrite = script.indexOf(
    '`begin;\\n${record.sql}\\n${ledgerInsertSql(record, "local-client-migration")}\\ncommit;`',
  );

  assert.notEqual(identityCheck, -1);
  assert.ok(identityCheck < adoptionWrite);
  assert.ok(identityCheck < migrationWrite);
  assert.match(script, /readStoreIdentityClientId/);
  assert.match(script, /hasMatchingLegacyBinding/);
  assert.match(script, /function legacyProjectBindingSql\(\)/);
  assert.match(
    script,
    /const bindingSql =[\s\S]*storeIdentityClientId === null[\s\S]*args\["bind-project"\] === true[\s\S]*legacyProjectBindingSql\(\)/,
  );
  assert.match(
    script,
    /!hadLedger[\s\S]*args\["adopt-manifest"\] === true[\s\S]*args\["bind-project"\] === true/,
  );
});
