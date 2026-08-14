import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
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
    14,
  );
  assert.equal(
    [...tableHomepage.matchAll(/^  \('60000000-0000-4000-8000-/gm)].length,
    14,
  );
  for (const type of [...v2Types, "deals", "new_arrivals"]) {
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
  assert.match(migration, /sort_base\.max_sort \+ ordered_defaults\.missing_position/);
  assert.match(migration, /\n  false,\n  ordered_defaults\.config/);
  assert.equal(
    [...migration.matchAll(/'60000000-0000-4000-8000-/g)].length,
    2,
  );
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
  assert.match(workflow, /^\s+provision_mode:/m);
  assert.match(workflow, /^\s+supabase_project_ref:/m);
  assert.match(
    workflow,
    /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/,
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

test("defines private exact product semantic search", () => {
  const migration = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "supabase",
      "migrations",
      "0035_ai_advisor_product_embeddings.sql",
    ),
    "utf8",
  );
  const productTrigger = migration.match(
    /create trigger trg_invalidate_product_embedding_from_product[\s\S]*?;/,
  )?.[0];
  const variantTrigger = migration.match(
    /create trigger trg_invalidate_product_embedding_from_variant[\s\S]*?;/,
  )?.[0];

  assert.match(migration, /create extension if not exists vector with schema extensions/);
  assert.match(migration, /embedding extensions\.vector\(2048\) not null/);
  assert.match(migration, /alter table public\.product_embeddings enable row level security/);
  assert.doesNotMatch(migration, /create policy/);
  assert.match(
    productTrigger,
    /update of title, description, product_type, sizing_mode, size_chart/,
  );
  assert.doesNotMatch(productTrigger, /price|stock|image/);
  assert.match(variantTrigger, /update of product_id, size, color/);
  assert.doesNotMatch(variantTrigger, /price|stock|image/);
  assert.match(migration, /after update of name, description on public\.categories/);
  assert.match(migration, /after insert or update or delete on public\.product_categories/);
  assert.match(migration, /where product\.status = 'active'[\s\S]*?not exists/);
  assert.match(migration, /product_embedding\.content_hash = md5\(source\.document\)/);
  assert.match(migration, /p_source_document is distinct from current_source/);
  assert.match(migration, /variant\.stock_quantity > 0/);
  assert.match(migration, /product\.current_price <= p_max_price/);
  assert.match(migration, /embedding <=> p_query_embedding/);
  assert.match(migration, /set enable_indexscan = off/);
  assert.match(migration, /least\(greatest\(coalesce\(p_match_count, 10\), 1\), 50\)/);
  for (const signature of [
    "get_product_embedding_sources\\(integer\\)",
    "store_product_embedding\\(uuid, extensions\\.vector, text, text\\)",
    "match_product_embeddings\\(extensions\\.vector, numeric, integer\\)",
  ]) {
    assert.match(
      migration,
      new RegExp(`revoke all on function public\\.${signature} from public`),
    );
    assert.match(
      migration,
      new RegExp(`grant execute on function public\\.${signature} to service_role`),
    );
  }
});
