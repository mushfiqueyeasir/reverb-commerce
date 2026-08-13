export const NAVBAR_VARIANTS = ["classic", "centered"] as const;
export const FOOTER_VARIANTS = ["classic", "compact"] as const;

export type NavbarVariant = (typeof NAVBAR_VARIANTS)[number];
export type FooterVariant = (typeof FOOTER_VARIANTS)[number];
export type NavbarItemKind = "link" | "categories";

export const NAVBAR_DESIGNS: ReadonlyArray<{
  variant: NavbarVariant;
  title: string;
  description: string;
  version: number;
}> = [
  {
    variant: "classic",
    title: "Classic navbar",
    description: "Logo left, navigation centered, and shopping actions right.",
    version: 1,
  },
  {
    variant: "centered",
    title: "Centered navbar",
    description: "Centered logo with navigation on a dedicated second row.",
    version: 2,
  },
];

export const FOOTER_DESIGNS: ReadonlyArray<{
  variant: FooterVariant;
  title: string;
  description: string;
  version: number;
}> = [
  {
    variant: "classic",
    title: "Classic footer",
    description: "Brand details and link columns share one spacious row.",
    version: 1,
  },
  {
    variant: "compact",
    title: "Compact footer",
    description: "Centered brand details with link columns arranged below.",
    version: 2,
  },
];

export interface NavbarItem {
  id: string;
  kind: NavbarItemKind;
  label: string;
  href: string;
}

export interface NavbarConfig {
  variant: NavbarVariant;
  items: NavbarItem[];
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterConfig {
  variant: FooterVariant;
  description: string;
  columns: FooterColumn[];
  legalLinks: FooterLink[];
}

export const DEFAULT_NAVBAR: NavbarConfig = {
  variant: "classic",
  items: [
    {
      id: "categories",
      kind: "categories",
      label: "Category",
      href: "/product",
    },
    { id: "about", kind: "link", label: "About", href: "/about-us" },
    { id: "reviews", kind: "link", label: "Reviews", href: "/reviews" },
    { id: "contact", kind: "link", label: "Contact", href: "/contact-us" },
  ],
};

export const DEFAULT_FOOTER: FooterConfig = {
  variant: "classic",
  description:
    "Browse products, discover new arrivals, and shop securely online.",
  columns: [
    {
      id: "shop",
      title: "Shop",
      links: [
        { id: "all-products", label: "All products", href: "/product" },
        { id: "favorites", label: "Favorites", href: "/wishlist" },
        { id: "cart", label: "Cart", href: "/cart" },
      ],
    },
    {
      id: "support",
      title: "Support",
      links: [
        { id: "track-order", label: "Track order", href: "/track-order" },
        {
          id: "shipping-returns",
          label: "Shipping & returns",
          href: "/refund-policy",
        },
        { id: "contact", label: "Contact", href: "/contact-us" },
      ],
    },
    {
      id: "brand",
      title: "Brand",
      links: [
        { id: "about", label: "About", href: "/about-us" },
        { id: "reviews", label: "Reviews", href: "/reviews" },
      ],
    },
  ],
  legalLinks: [
    { id: "terms", label: "Terms of service", href: "/terms-of-service" },
    { id: "privacy", label: "Privacy policy", href: "/privacy-policy" },
    {
      id: "refund",
      label: "Shipping & returns",
      href: "/refund-policy",
    },
  ],
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, fallback: string, maxLength = 80): string {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

export function isSafeChromeHref(value: string): boolean {
  const href = value.trim();
  if (
    !href ||
    href.length > 300 ||
    href.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(href)
  ) {
    return false;
  }
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  return /^(https:\/\/|mailto:|tel:)/i.test(href);
}

export function isExternalChromeHref(value: string): boolean {
  return /^https:\/\//i.test(value.trim());
}

function normalizeLink(value: unknown, fallbackId: string): FooterLink | null {
  const item = record(value);
  if (!item) return null;
  const label = text(item.label, "", 60);
  const href = text(item.href, "", 300);
  if (!label || !isSafeChromeHref(href)) return null;
  return {
    id: text(item.id, fallbackId, 80),
    label,
    href,
  };
}

function uniqueIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    let id = item.id || `item-${index + 1}`;
    while (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);
    return { ...item, id };
  });
}

export function normalizeNavbarConfig(value: unknown): NavbarConfig {
  const input = record(value);
  if (!input) return structuredClone(DEFAULT_NAVBAR);
  const rawItems = Array.isArray(input.items) ? input.items.slice(0, 6) : null;
  let hasCategories = false;
  const items = uniqueIds(
    (rawItems ?? DEFAULT_NAVBAR.items)
      .map((value, index): NavbarItem | null => {
        const item = record(value);
        if (!item) return null;
        const kind: NavbarItemKind =
          item.kind === "categories" && !hasCategories ? "categories" : "link";
        if (kind === "categories") hasCategories = true;
        const label = text(item.label, "", 40);
        const href =
          kind === "categories" ? "/product" : text(item.href, "", 300);
        if (!label || !isSafeChromeHref(href)) return null;
        return {
          id: text(item.id, `navbar-${index + 1}`, 80),
          kind,
          label,
          href,
        };
      })
      .filter((item): item is NavbarItem => Boolean(item)),
  );
  return {
    variant: NAVBAR_VARIANTS.includes(input.variant as NavbarVariant)
      ? (input.variant as NavbarVariant)
      : DEFAULT_NAVBAR.variant,
    items,
  };
}

export function normalizeFooterConfig(
  value: unknown,
  legacyDescription?: unknown,
): FooterConfig {
  const input = record(value);
  if (!input) {
    const fallback = structuredClone(DEFAULT_FOOTER);
    if (typeof legacyDescription === "string" && legacyDescription.trim()) {
      fallback.description = legacyDescription.trim().slice(0, 500);
    }
    return fallback;
  }
  const columns = uniqueIds(
    (Array.isArray(input.columns)
      ? input.columns.slice(0, 3)
      : DEFAULT_FOOTER.columns
    )
      .map((value, columnIndex): FooterColumn | null => {
        const column = record(value);
        if (!column) return null;
        const title = text(column.title, "", 40);
        if (!title) return null;
        const links = uniqueIds(
          (Array.isArray(column.links) ? column.links.slice(0, 10) : [])
            .map((link, linkIndex) =>
              normalizeLink(link, `footer-${columnIndex + 1}-${linkIndex + 1}`),
            )
            .filter((link): link is FooterLink => Boolean(link)),
        );
        return {
          id: text(column.id, `column-${columnIndex + 1}`, 80),
          title,
          links,
        };
      })
      .filter((column): column is FooterColumn => Boolean(column)),
  );
  const legalLinks = uniqueIds(
    (Array.isArray(input.legalLinks)
      ? input.legalLinks.slice(0, 6)
      : DEFAULT_FOOTER.legalLinks
    )
      .map((link, index) => normalizeLink(link, `legal-${index + 1}`))
      .filter((link): link is FooterLink => Boolean(link)),
  );
  return {
    variant: FOOTER_VARIANTS.includes(input.variant as FooterVariant)
      ? (input.variant as FooterVariant)
      : DEFAULT_FOOTER.variant,
    description:
      typeof input.description === "string"
        ? input.description.trim().slice(0, 500)
        : DEFAULT_FOOTER.description,
    columns,
    legalLinks,
  };
}
