import type { MenuLink, MenuType } from "@/type/menyType";
import type { Category } from "@/type/categoryType";
import {
  DEFAULT_NAVBAR,
  normalizeNavbarConfig,
  type NavbarConfig,
} from "../lib/cms/siteChrome";

function categoryHref(category: Category): string {
  return category.isDefault
    ? "/product"
    : `/product?category=${encodeURIComponent(category.categoryUrl.current)}`;
}

function categoryMenuItems(categories: Category[]): MenuLink[] {
  const children = new Map<string, Category[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const siblings = children.get(category.parentId) ?? [];
    siblings.push(category);
    children.set(category.parentId, siblings);
  }

  const mapCategory = (category: Category): MenuLink => ({
    label: category.categoryName,
    href: categoryHref(category),
    imageUrl: category.imageUrl,
    isDefault: category.isDefault,
    items: (children.get(category._id) ?? []).map(mapCategory),
  });

  return categories.filter((category) => !category.parentId).map(mapCategory);
}

export function getMenuData(
  categories: Category[] = [],
  config: NavbarConfig = DEFAULT_NAVBAR,
): MenuType[] {
  const navbar = normalizeNavbarConfig(config);
  return navbar.items.map((item) => ({
    label: item.label,
    href: item.href,
    kind: item.kind === "categories" ? "categories" : "links",
    items:
      item.kind === "categories" ? categoryMenuItems(categories) : undefined,
  }));
}
