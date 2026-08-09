import { describe, expect, it } from "vitest";
import { getMenuData } from "./menuData";
import type { Category } from "@/type/categoryType";

const categories: Category[] = [
  {
    _id: "default",
    categoryName: "Shop everything",
    categoryDescription: null,
    imageUrl: null,
    isDefault: true,
    categoryUrl: { current: "renamed-default" },
  },
  {
    _id: "helmets",
    categoryName: "Helmets",
    categoryDescription: null,
    imageUrl: null,
    isDefault: false,
    categoryUrl: { current: "helmets-and-gear" },
  },
];

describe("getMenuData", () => {
  it("links the editable default category to all products", () => {
    expect(getMenuData(categories)[0].items).toEqual([
      { label: "Shop everything", href: "/product" },
      {
        label: "Helmets",
        href: "/product?category=helmets-and-gear",
      },
    ]);
  });
});
