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

export interface NavbarAnnouncement {
  text: string;
  active: boolean;
  url: string | null;
}

export interface NavbarCopy {
  primaryNavigationAriaLabel: string;
  desktopSearchAriaLabel: string;
  desktopFavoritesAriaLabel: string;
  desktopBagAriaLabel: string;
  homeLinkAriaLabelTemplate: string;
  shopAllTemplate: string;
  collectionsCountTemplate: string;
  mobileNavigationAriaLabel: string;
  mobileHomeLabel: string;
  mobileSavedLabel: string;
  mobileShopLabel: string;
  mobileBagLabel: string;
  mobileSearchLabel: string;
  mobileSearchAriaLabel: string;
  countOverflowLabel: string;
  collectionsLabel: string;
  shopByCategoryLabel: string;
  primaryCategoryLabel: string;
  exploreLabel: string;
  emptyCollectionLabel: string;
  compactMenuTitle: string;
  compactMenuDescription: string;
}

export interface ProductCardCopy {
  addFavoriteAriaLabel: string;
  removeFavoriteAriaLabel: string;
  favoriteSavedToast: string;
  favoriteRemovedToast: string;
  soldOutButtonLabel: string;
  quickAddButtonLabel: string;
}

export interface NavbarConfig {
  variant: NavbarVariant;
  items: NavbarItem[];
  announcement: NavbarAnnouncement | null;
  copy: NavbarCopy;
  productCardCopy: ProductCardCopy;
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

export interface FooterCopy {
  homeLinkAriaLabelTemplate: string;
  copyrightTemplate: string;
  facebookAriaLabel: string;
  instagramAriaLabel: string;
  twitterAriaLabel: string;
  youtubeAriaLabel: string;
}

export interface FooterConfig {
  variant: FooterVariant;
  description: string;
  columns: FooterColumn[];
  legalLinks: FooterLink[];
  copy: FooterCopy;
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
  announcement: null,
  copy: {
    primaryNavigationAriaLabel: "Primary navigation",
    desktopSearchAriaLabel: "Search products",
    desktopFavoritesAriaLabel: "Favorites",
    desktopBagAriaLabel: "Shopping bag",
    homeLinkAriaLabelTemplate: "{storeName} home",
    shopAllTemplate: "Shop all {label}",
    collectionsCountTemplate: "{count} collections",
    mobileNavigationAriaLabel: "Mobile shopping navigation",
    mobileHomeLabel: "Home",
    mobileSavedLabel: "Saved",
    mobileShopLabel: "Shop",
    mobileBagLabel: "Cart",
    mobileSearchLabel: "Search",
    mobileSearchAriaLabel: "Search products",
    countOverflowLabel: "9+",
    collectionsLabel: "Collections",
    shopByCategoryLabel: "Shop by category",
    primaryCategoryLabel: "Primary category",
    exploreLabel: "Explore",
    emptyCollectionLabel: "Explore all products in this collection.",
    compactMenuTitle: "Shop categories",
    compactMenuDescription: "Find your collection.",
  },
  productCardCopy: {
    addFavoriteAriaLabel: "Add to favorites",
    removeFavoriteAriaLabel: "Remove from favorites",
    favoriteSavedToast: "Saved to favorites",
    favoriteRemovedToast: "Removed from favorites",
    soldOutButtonLabel: "Sold Out",
    quickAddButtonLabel: "Quick Add",
  },
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
  copy: {
    homeLinkAriaLabelTemplate: "{storeName} home",
    copyrightTemplate: "© {year} {storeName}",
    facebookAriaLabel: "Facebook",
    instagramAriaLabel: "Instagram",
    twitterAriaLabel: "X",
    youtubeAriaLabel: "YouTube",
  },
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

function normalizeCopy<T extends Record<keyof T, string>>(
  value: unknown,
  fallback: T,
): T {
  const input = record(value);
  return Object.fromEntries(
    Object.entries(fallback).map(([key, fallbackValue]) => [
      key,
      text(input?.[key], String(fallbackValue), 160),
    ]),
  ) as T;
}

type ChromeTemplateToken = "label" | "count" | "storeName" | "year";

export function interpolateChromeTemplate(
  template: string,
  values: Partial<Record<ChromeTemplateToken, string | number>>,
  allowedTokens: readonly ChromeTemplateToken[],
): string {
  const allowed = new Set(allowedTokens);
  return template.replace(
    /\{(label|count|storeName|year)\}/g,
    (placeholder, token: ChromeTemplateToken) =>
      allowed.has(token) && values[token] !== undefined
        ? String(values[token])
        : placeholder,
  );
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

function normalizeNavbarAnnouncement(
  value: unknown,
): NavbarAnnouncement | null {
  const input = record(value);
  if (!input) return null;
  const text =
    typeof input.text === "string"
      ? input.text.replace(/\s+/g, " ").trim().slice(0, 160)
      : "";
  const rawUrl = typeof input.url === "string" ? input.url.trim() : "";
  return {
    text,
    active: text.length > 0 && input.active === true,
    url: rawUrl && isSafeChromeHref(rawUrl) ? rawUrl : null,
  };
}

export function resolveKawaiiAnnouncement(
  announcement: NavbarAnnouncement | null,
  legacy: {
    text?: string | null;
    active?: boolean;
    url?: string | null;
  },
): NavbarAnnouncement {
  if (announcement !== null) return announcement;
  return {
    text: legacy.text ?? "",
    active: legacy.active === true,
    url: legacy.url ?? null,
  };
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

export function normalizeProductCardCopy(value: unknown): ProductCardCopy {
  return normalizeCopy(value, DEFAULT_NAVBAR.productCardCopy);
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
    announcement: normalizeNavbarAnnouncement(input.announcement),
    copy: normalizeCopy(input.copy, DEFAULT_NAVBAR.copy),
    productCardCopy: normalizeProductCardCopy(input.productCardCopy),
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
    copy: normalizeCopy(input.copy, DEFAULT_FOOTER.copy),
  };
}
