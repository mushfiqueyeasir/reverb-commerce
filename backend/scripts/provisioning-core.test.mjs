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
});
