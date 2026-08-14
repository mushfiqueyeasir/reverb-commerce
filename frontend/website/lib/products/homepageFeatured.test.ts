import { describe, expect, it } from "vitest";
import type { TransformedProduct } from "@/type/productType";
import { selectHomepageProducts } from "./homepageFeatured";

function product(
  id: string,
  quantity: number,
  options: {
    originalPrice?: number;
    currentPrice?: number;
    createdAt?: string;
  } = {},
): TransformedProduct {
  return {
    id,
    title: id,
    image: "",
    originalPrice: options.originalPrice ?? 100,
    currentPrice: options.currentPrice ?? 100,
    href: `/product/${id}`,
    slug: id,
    sizingMode: "none",
    stock: [{ id: `${id}-stock`, size: null, color: null, quantity }],
    sizeChart: [],
    categories: [],
    createdAt: options.createdAt ?? "2026-01-01T00:00:00.000Z",
  };
}

describe("selectHomepageProducts", () => {
  it("keeps available products before sold-out products", () => {
    const products = [
      product("sold-1", 0),
      product("available-1", 2),
      product("sold-2", 0),
      product("available-2", 1),
    ];
    expect(selectHomepageProducts(products, 4).map((item) => item.id)).toEqual([
      "available-1",
      "available-2",
      "sold-1",
      "sold-2",
    ]);
  });

  it("caps product grids at five", () => {
    const products = [
      product("available-1", 1),
      product("available-2", 1),
      product("available-3", 1),
      product("available-4", 1),
      product("available-5", 1),
      product("available-6", 1),
    ];
    expect(selectHomepageProducts(products, 20).map((item) => item.id)).toEqual(
      [
        "available-1",
        "available-2",
        "available-3",
        "available-4",
        "available-5",
      ],
    );
    expect(
      selectHomepageProducts(products, 4, 5).map((item) => item.id),
    ).toEqual([
      "available-1",
      "available-2",
      "available-3",
      "available-4",
      "available-5",
    ]);
    expect(
      selectHomepageProducts(products, 5, 6).map((item) => item.id),
    ).toEqual([
      "available-1",
      "available-2",
      "available-3",
      "available-4",
      "available-5",
      "available-6",
    ]);
  });

  it("selects only discounted products and ranks the largest savings first", () => {
    const products = [
      product("ten", 1, { currentPrice: 90 }),
      product("full-price", 1),
      product("forty", 1, { currentPrice: 60 }),
      product("twenty-five", 1, { currentPrice: 75 }),
      product("invalid-original", 1, {
        originalPrice: 0,
        currentPrice: -10,
      }),
      product("negative-price", 1, {
        currentPrice: -10,
      }),
    ];

    expect(
      selectHomepageProducts(products, 10, 10, "deals").map((item) => item.id),
    ).toEqual(["forty", "twenty-five", "ten"]);
  });

  it("ranks new arrivals by creation date and puts invalid dates last", () => {
    const products = [
      product("old", 1, { createdAt: "2025-01-01T00:00:00.000Z" }),
      product("invalid", 1, { createdAt: "not-a-date" }),
      product("new", 1, { createdAt: "2026-07-01T00:00:00.000Z" }),
      product("middle", 1, { createdAt: "2026-02-01T00:00:00.000Z" }),
    ];

    expect(
      selectHomepageProducts(products, 10, 10, "new-arrivals").map(
        (item) => item.id,
      ),
    ).toEqual(["new", "middle", "old", "invalid"]);
  });

  it("keeps stock availability ahead of the selected ranking", () => {
    const products = [
      product("new-sold-out", 0, {
        createdAt: "2026-08-01T00:00:00.000Z",
      }),
      product("old-available", 1, {
        createdAt: "2025-01-01T00:00:00.000Z",
      }),
    ];

    expect(
      selectHomepageProducts(products, 2, 4, "new-arrivals").map(
        (item) => item.id,
      ),
    ).toEqual(["old-available", "new-sold-out"]);
  });

  it("does not mutate the catalog order", () => {
    const products = [
      product("old", 1, { createdAt: "2025-01-01T00:00:00.000Z" }),
      product("new", 1, { createdAt: "2026-01-01T00:00:00.000Z" }),
    ];

    selectHomepageProducts(products, 2, 4, "new-arrivals");

    expect(products.map((item) => item.id)).toEqual(["old", "new"]);
  });
});
