import assert from "node:assert/strict";
import test from "node:test";
import { Readable } from "node:stream";
import {
  buildCatalog,
  csvRows,
  deterministicUuid,
} from "./import-kawaii-products.mjs";

test("csvRows parses escaped quotes and multiline fields", async () => {
  const input = Readable.from([
    '"id","title","body"\r\n"1","A ""quoted"" title","first\n',
    'second"\r\n',
  ]);
  const rows = [];
  for await (const row of csvRows(input)) rows.push(row);
  assert.deepEqual(rows, [
    ["id", "title", "body"],
    ["1", 'A "quoted" title', "first\nsecond"],
  ]);
});

test("deterministicUuid is stable and namespaced", () => {
  const first = deterministicUuid("product:123");
  assert.equal(first, deterministicUuid("product:123"));
  assert.notEqual(first, deterministicUuid("variant:123"));
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("buildCatalog preserves product data and maps categories", () => {
  const parsed = {
    metadata: new Map([
      [
        "10",
        {
          _price: "900",
          _regular_price: "1000",
          _sku: "SKU-10",
          _stock: "7",
          _thumbnail_id: "20",
        },
      ],
    ]),
    posts: new Map([
      [
        "10",
        {
          id: "10",
          postDate: "2024-01-01 10:00:00",
          postDateGmt: "2024-01-01 04:00:00",
          content: "<p>Safe</p><script>unsafe()</script>",
          title: "Cleanser &amp; Toner",
          excerpt: "",
          status: "publish",
          slug: "cleanser-toner",
          modified: "2024-01-02 10:00:00",
          modifiedGmt: "2024-01-02 04:00:00",
        },
      ],
    ]),
    attachments: new Map([
      ["20", { guid: "http://kawaii.com.bd/wp-content/uploads/image.jpg" }],
    ]),
    terms: new Map([["30", { id: "30", slug: "cleansers" }]]),
    relationships: [{ objectId: "10", taxonomyId: "40" }],
    taxonomies: new Map([
      ["40", { id: "40", termId: "30", taxonomy: "product_cat" }],
    ]),
    lookups: new Map(),
  };
  const categories = [
    { id: "00000000-0000-4000-8000-000000000001", slug: "default", is_default: true },
    { id: "00000000-0000-4000-8000-000000000002", slug: "cleansers", is_default: false },
    { id: "00000000-0000-4000-8000-000000000003", slug: "bath-personal-care", is_default: false },
    { id: "00000000-0000-4000-8000-000000000004", slug: "body-care", is_default: false },
    { id: "00000000-0000-4000-8000-000000000005", slug: "soap", is_default: false },
    { id: "00000000-0000-4000-8000-000000000006", slug: "eye-care", is_default: false },
    { id: "00000000-0000-4000-8000-000000000007", slug: "makeup", is_default: false },
    { id: "00000000-0000-4000-8000-000000000008", slug: "face-wash", is_default: false },
    { id: "00000000-0000-4000-8000-000000000009", slug: "skincare", is_default: false },
    { id: "00000000-0000-4000-8000-000000000010", slug: "green-tea", is_default: false },
    { id: "00000000-0000-4000-8000-000000000011", slug: "hair-treatment", is_default: false },
    { id: "00000000-0000-4000-8000-000000000012", slug: "hair-oil-serum", is_default: false },
    { id: "00000000-0000-4000-8000-000000000013", slug: "hand-foot-care", is_default: false },
    { id: "00000000-0000-4000-8000-000000000014", slug: "health-supplements", is_default: false },
    { id: "00000000-0000-4000-8000-000000000015", slug: "lip-care", is_default: false },
    { id: "00000000-0000-4000-8000-000000000016", slug: "toners-lotions", is_default: false },
    { id: "00000000-0000-4000-8000-000000000017", slug: "mens-skincare", is_default: false },
    { id: "00000000-0000-4000-8000-000000000018", slug: "moisturizers-creams", is_default: false },
    { id: "00000000-0000-4000-8000-000000000019", slug: "hair-care", is_default: false },
    { id: "00000000-0000-4000-8000-000000000020", slug: "serums-essences", is_default: false },
    { id: "00000000-0000-4000-8000-000000000021", slug: "face-masks", is_default: false },
    { id: "00000000-0000-4000-8000-000000000022", slug: "powder", is_default: false },
    { id: "00000000-0000-4000-8000-000000000023", slug: "sunscreens", is_default: false },
    { id: "00000000-0000-4000-8000-000000000024", slug: "feminine-care", is_default: false },
    { id: "00000000-0000-4000-8000-000000000025", slug: "anti-aging-care", is_default: false },
  ];
  const catalog = buildCatalog(parsed, categories);
  assert.equal(catalog.products.length, 1);
  assert.equal(catalog.products[0].title, "Cleanser & Toner");
  assert.equal(catalog.products[0].current_price, 900);
  assert.equal(catalog.products[0].original_price, 1000);
  assert.equal(catalog.products[0].status, "active");
  assert.equal(catalog.products[0].description.html, "<p>Safe</p>");
  assert.equal(catalog.variants[0].stock_quantity, 7);
  assert.equal(catalog.images[0].path, "https://kawaii.com.bd/wp-content/uploads/image.jpg");
  assert.equal(catalog.productCategories.length, 2);
});
