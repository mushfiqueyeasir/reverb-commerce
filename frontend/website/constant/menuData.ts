import { MenuType } from "@/type/menyType";
import type { Category } from "@/type/categoryType";
import {
  DEFAULT_NAVBAR,
  normalizeNavbarConfig,
  type NavbarConfig,
} from "../lib/cms/siteChrome";

export function getMenuData(
  categories: Category[] = [],
  config: NavbarConfig = DEFAULT_NAVBAR,
): MenuType[] {
  const navbar = normalizeNavbarConfig(config);
  return navbar.items.map((item) => ({
    label: item.label,
    href: item.href,
    items:
      item.kind === "categories"
        ? categories.map((category) => ({
            label: category.categoryName,
            href: category.isDefault
              ? "/product"
              : `/product?category=${encodeURIComponent(category.categoryUrl.current)}`,
          }))
        : undefined,
  }));
}
