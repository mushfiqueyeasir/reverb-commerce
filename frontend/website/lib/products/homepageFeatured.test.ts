import { describe, expect, it } from "vitest";
import type { TransformedProduct } from "@/type/productType";
import { selectHomepageProducts } from "./homepageFeatured";

function product(id: string, quantity: number): TransformedProduct {
  return {
    id,
    title: id,
    image: "",
    originalPrice: 100,
    currentPrice: 100,
    href: `/product/${id}`,
    slug: id,
    sizingMode: "none",
    stock: [{ id: `${id}-stock`, size: null, color: null, quantity }],
    sizeChart: [],
    categories: [],
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

  it("caps Grid at four and Runway at five", () => {
    const products = [
      product("available-1", 1),
      product("available-2", 1),
      product("available-3", 1),
      product("available-4", 1),
      product("available-5", 1),
      product("available-6", 1),
    ];
    expect(selectHomepageProducts(products, 20).map((item) => item.id)).toEqual(
      ["available-1", "available-2", "available-3", "available-4"],
    );
    expect(
      selectHomepageProducts(products, 20, 5).map((item) => item.id),
    ).toEqual([
      "available-1",
      "available-2",
      "available-3",
      "available-4",
      "available-5",
    ]);
  });
});
