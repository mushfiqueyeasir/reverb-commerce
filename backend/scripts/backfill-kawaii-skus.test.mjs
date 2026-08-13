import assert from "node:assert/strict";
import test from "node:test";
import { planSkuBackfill, skuBase } from "./backfill-kawaii-skus.mjs";

test("skuBase matches the storefront SKU format", () => {
  assert.equal(skuBase("Coral Signal Tee", "Black", "XL"), "COR-SIG-TEE-BLK-XL");
  assert.equal(skuBase("Utility Bottle", "", ""), "UTI-BOT");
});

test("planSkuBackfill preserves SKUs and resolves collisions", () => {
  const rows = [
    {
      product_id: "10000000-0000-0000-0000-000000000000",
      variant_id: "aaaaaaaa-0000-0000-0000-000000000000",
      title: "Utility Bottle",
      color: null,
      size: null,
      sku: " UTI-BOT ",
    },
    {
      product_id: "20000000-0000-0000-0000-000000000000",
      variant_id: "bbbbbbbb-0000-0000-0000-000000000000",
      title: "Utility Bottle",
      color: null,
      size: null,
      sku: null,
    },
    {
      product_id: "30000000-0000-0000-0000-000000000000",
      variant_id: "cccccccc-0000-0000-0000-000000000000",
      title: "Different Product",
      color: null,
      size: null,
      sku: "",
    },
  ];
  assert.deepEqual(planSkuBackfill(rows), [
    {
      variant_id: "bbbbbbbb-0000-0000-0000-000000000000",
      sku: "UTI-BOT-BBBBBBBB",
    },
    {
      variant_id: "cccccccc-0000-0000-0000-000000000000",
      sku: "DIF-PRO",
    },
  ]);
});

test("planSkuBackfill rejects products without inventory", () => {
  assert.throws(
    () =>
      planSkuBackfill([
        {
          product_id: "missing",
          variant_id: null,
          title: "Missing",
          color: null,
          size: null,
          sku: null,
        },
      ]),
    /no inventory row/,
  );
});
