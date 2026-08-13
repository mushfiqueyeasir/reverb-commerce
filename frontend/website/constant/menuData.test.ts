import { describe, expect, it } from "vitest";
import { getMenuData } from "./menuData";
import type { Category } from "@/type/categoryType";

const categories: Category[] = [
  {
    _id: "default",
    categoryName: "Shop everything",
    categoryDescription: null,
    imageUrl: null,
    parentId: null,
    sort: 0,
    depth: 0,
    isDefault: true,
    categoryUrl: { current: "renamed-default" },
  },
  {
    _id: "helmets",
    categoryName: "Helmets",
    categoryDescription: null,
    imageUrl: null,
    parentId: null,
    sort: 10,
    depth: 0,
    isDefault: false,
    categoryUrl: { current: "helmets-and-gear" },
  },
  {
    _id: "full-face",
    categoryName: "Full face",
    categoryDescription: null,
    imageUrl: null,
    parentId: "helmets",
    sort: 10,
    depth: 1,
    isDefault: false,
    categoryUrl: { current: "full-face" },
  },
];

describe("getMenuData", () => {
  it("groups subcategories beneath their primary category", () => {
    expect(getMenuData(categories)[0]).toEqual({
      label: "Category",
      href: "/product",
      kind: "categories",
      items: [
        {
          label: "Shop everything",
          href: "/product",
          imageUrl: null,
          isDefault: true,
          items: [],
        },
        {
          label: "Helmets",
          href: "/product?category=helmets-and-gear",
          imageUrl: null,
          isDefault: false,
          items: [
            {
              label: "Full face",
              href: "/product?category=full-face",
              imageUrl: null,
              isDefault: false,
              items: [],
            },
          ],
        },
      ],
    });
  });
});
