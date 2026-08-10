import type { UserRole } from "@/type/db";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  group: "Overview" | "Catalog" | "Sales" | "Content" | "Store";
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "LayoutDashboard",
    roles: ["admin", "editor", "viewer"],
    group: "Overview",
  },

  {
    label: "Products",
    href: "/admin/products",
    icon: "Package",
    roles: ["admin", "editor", "viewer"],
    group: "Catalog",
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: "Boxes",
    roles: ["admin", "editor", "viewer"],
    group: "Catalog",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: "Tags",
    roles: ["admin", "editor", "viewer"],
    group: "Catalog",
  },

  {
    label: "Orders",
    href: "/admin/orders",
    icon: "ShoppingCart",
    roles: ["admin", "editor", "viewer"],
    group: "Sales",
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: "Users",
    roles: ["admin", "editor", "viewer"],
    group: "Sales",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: "FileBarChart",
    roles: ["admin", "editor", "viewer"],
    group: "Sales",
  },
  {
    label: "Promo codes",
    href: "/admin/promo-codes",
    icon: "TicketPercent",
    roles: ["admin", "editor", "viewer"],
    group: "Sales",
  },

  {
    label: "Homepage",
    href: "/admin/homepage",
    icon: "LayoutTemplate",
    roles: ["admin", "editor", "viewer"],
    group: "Content",
  },
  {
    label: "About",
    href: "/admin/about",
    icon: "BookOpen",
    roles: ["admin", "editor", "viewer"],
    group: "Content",
  },
  {
    label: "Pages",
    href: "/admin/pages",
    icon: "FileText",
    roles: ["admin", "editor", "viewer"],
    group: "Content",
  },
  {
    label: "Promotions",
    href: "/admin/promotions",
    icon: "BadgePercent",
    roles: ["admin", "editor", "viewer"],
    group: "Content",
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: "Star",
    roles: ["admin", "editor", "viewer"],
    group: "Content",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "Settings",
    roles: ["admin"],
    group: "Store",
  },
  {
    label: "Contact",
    href: "/admin/contact",
    icon: "Mail",
    roles: ["admin", "editor", "viewer"],
    group: "Store",
  },
  {
    label: "Users & Roles",
    href: "/admin/users",
    icon: "ShieldCheck",
    roles: ["admin"],
    group: "Store",
  },
  {
    label: "Audit log",
    href: "/admin/audit",
    icon: "ScrollText",
    roles: ["admin"],
    group: "Store",
  },
];

export const NAV_GROUPS: NavItem["group"][] = [
  "Overview",
  "Catalog",
  "Sales",
  "Content",
  "Store",
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}
