import { MenuType } from "@/type/menyType";
import type { Category } from "@/type/categoryType";

export function getMenuData(categories: Category[] = []): MenuType[] {
  return [
    {
      label: "Category",
      href: "/product",
      items: categories.map((category) => ({
        label: category.categoryName,
        href: category.isDefault
          ? "/product"
          : `/product?category=${encodeURIComponent(category.categoryUrl.current)}`,
      })),
    },
    {
      label: "About",
      href: "/about-us",
    },
    {
      label: "Reviews",
      href: "/reviews",
    },
    {
      label: "Contact",
      href: "/contact-us",
    },
  ];
}
