import { describe, expect, it } from "vitest";
import type { Category } from "@/type/categoryType";
import {
  filterCategoriesWithProductLinks,
  flattenCategoryHierarchy,
  getCategoryBreadcrumb,
  getDescendantSlugs,
} from "./hierarchy";

function category(
  id: string,
  name: string,
  parentId: string | null,
  sort: number,
  isDefault = false,
): Category {
  return {
    _id: id,
    categoryName: name,
    categoryDescription: null,
    imageUrl: null,
    parentId,
    sort,
    depth: 0,
    isDefault,
    categoryUrl: { current: id },
  };
}

const categories = [
  category("child-b", "Child B", "parent", 20),
  category("default", "Default", null, 0, true),
  category("parent", "Parent", null, 20),
  category("child-a", "Child A", "parent", 10),
  category("root", "Root", null, 10),
  category("grandchild", "Grandchild", "child-a", 10),
];

describe("category hierarchy", () => {
  it("orders roots and descendants in preorder", () => {
    expect(
      flattenCategoryHierarchy(categories).map((item) => [
        item._id,
        item.depth,
      ]),
    ).toEqual([
      ["default", 0],
      ["root", 0],
      ["parent", 0],
      ["child-a", 1],
      ["grandchild", 2],
      ["child-b", 1],
    ]);
  });

  it("expands selected parents to descendant slugs", () => {
    expect([...getDescendantSlugs(categories, ["parent"])]).toEqual([
      "parent",
      "child-a",
      "grandchild",
      "child-b",
    ]);
  });

  it("keeps linked categories and their parent path", () => {
    expect(
      filterCategoriesWithProductLinks(
        flattenCategoryHierarchy(categories),
        new Set(["grandchild", "default"]),
      ).map((item) => item._id),
    ).toEqual(["default", "root", "parent", "child-a", "grandchild"]);
  });

  it("keeps the default category even when it has no product links", () => {
    expect(
      filterCategoriesWithProductLinks(
        flattenCategoryHierarchy(categories),
        new Set(["grandchild"]),
      ).map((item) => item._id),
    ).toEqual(["default", "root", "parent", "child-a", "grandchild"]);
  });

  it("keeps root categories even when they have no product links", () => {
    expect(
      filterCategoriesWithProductLinks(
        flattenCategoryHierarchy(categories),
        new Set(["child-a"]),
      ).map((item) => item._id),
    ).toEqual(["default", "root", "parent", "child-a"]);
  });

  it("builds category breadcrumbs", () => {
    expect(getCategoryBreadcrumb(categories, "grandchild")).toEqual([
      "Parent",
      "Child A",
      "Grandchild",
    ]);
  });
});
