import {
  DEFAULT_HOMEPAGE_SECTIONS,
  HOMEPAGE_SECTION_TYPES,
  type HomepageSectionRow,
  type HomepageSectionType,
  type HomepageSectionV1Type,
  type HomepageSupportSectionType,
} from "../../type/db";

export type HomepageProductSelection = "featured" | "deals" | "new-arrivals";
export type HomepageSectionFamily =
  | HomepageSectionV1Type
  | HomepageSupportSectionType
  | "ai_search";

export interface HomepageSectionMetadata {
  family: HomepageSectionFamily;
  version: 1 | 2;
  displayName: string;
  productSelection?: HomepageProductSelection;
}

export const HOMEPAGE_SECTION_METADATA: Record<
  HomepageSectionType,
  HomepageSectionMetadata
> = {
  banner: { family: "banner", version: 1, displayName: "Hero - Classic" },
  categories: {
    family: "categories",
    version: 1,
    displayName: "Categories - Mosaic",
  },
  deals: {
    family: "featured",
    version: 1,
    displayName: "Products - Deals",
    productSelection: "deals",
  },
  new_arrivals: {
    family: "featured",
    version: 1,
    displayName: "Products - New Arrivals",
    productSelection: "new-arrivals",
  },
  featured: {
    family: "featured",
    version: 1,
    displayName: "Products - Grid",
    productSelection: "featured",
  },
  reviews: {
    family: "reviews",
    version: 1,
    displayName: "Reviews - Marquee",
  },
  promo: { family: "promo", version: 1, displayName: "Promotion - Banner" },
  richtext: { family: "richtext", version: 1, displayName: "Story - Classic" },
  banner_v2: {
    family: "banner",
    version: 2,
    displayName: "Hero - Cinematic",
  },
  categories_v2: {
    family: "categories",
    version: 2,
    displayName: "Categories - Collection Index",
  },
  featured_v2: {
    family: "featured",
    version: 2,
    displayName: "Products - Runway",
    productSelection: "featured",
  },
  reviews_v2: {
    family: "reviews",
    version: 2,
    displayName: "Reviews - Showcase",
  },
  promo_v2: {
    family: "promo",
    version: 2,
    displayName: "Promotion - Kinetic Offer",
  },
  richtext_v2: {
    family: "richtext",
    version: 2,
    displayName: "Story - Editorial",
  },
  guarantees: {
    family: "guarantees",
    version: 1,
    displayName: "Shopping Guarantees",
  },
  studio_notes: {
    family: "studio_notes",
    version: 1,
    displayName: "Studio Notes",
  },
  ai_search: {
    family: "ai_search",
    version: 1,
    displayName: "AI Search - Promo",
  },
};

export interface KawaiiGuaranteeItem {
  title: string;
  body: string;
}

export interface KawaiiGuaranteesConfig {
  accessibleLabel: string;
  items: [KawaiiGuaranteeItem, KawaiiGuaranteeItem, KawaiiGuaranteeItem];
}

export interface KawaiiStudioNotesConfig {
  eyebrow: string;
  ctaLabel: string;
  ctaUrl: string;
}

export const KAWAII_HOMEPAGE_TEXT_FIELD_LIMITS: Partial<
  Record<HomepageSectionFamily, Readonly<Record<string, number>>>
> = {
  banner: {
    description: 1000,
    edit_label: 120,
    footer_note: 240,
    image_badge: 120,
    carousel_role_description: 120,
    carousel_announcement_template: 240,
    pause_label: 120,
    resume_label: 120,
    previous_label: 120,
    next_label: 120,
  },
  categories: {
    eyebrow: 120,
    cta_label: 120,
    cta_url: 500,
  },
  featured: {
    eyebrow: 120,
    cta_label: 120,
    cta_url: 500,
    sold_out_badge: 120,
    special_price_badge: 120,
    default_badge: 120,
    product_list_label: 120,
    uncategorized_label_template: 160,
  },
  reviews: {
    eyebrow: 120,
    cta_label: 120,
    cta_url: 500,
    customer_fallback: 160,
    body_fallback: 1000,
    item_label_template: 160,
    verified_label: 120,
    rating_aria_template: 200,
  },
  promo: {
    cta_label: 120,
    cta_url: 500,
    kicker: 160,
    limited_label: 120,
    discount_suffix: 80,
    image_eyebrow: 120,
    image_title: 160,
    cta_fallback_label: 120,
  },
  richtext: {
    eyebrow: 120,
    cta_label: 120,
    cta_url: 500,
    image_alt: 500,
    image_label: 160,
    image_value: 200,
    image_tag: 120,
    copy_label: 160,
    cards_label: 160,
  },
  ai_search: {
    eyebrow: 120,
    pill_label: 120,
    cta_label: 120,
    image_path: 500,
    image_alt: 500,
  },
};

export function normalizeKawaiiHomepageTextConfig(
  family: HomepageSectionFamily,
  config: Record<string, unknown>,
): { config: Record<string, unknown>; error?: string } {
  const limits = KAWAII_HOMEPAGE_TEXT_FIELD_LIMITS[family];
  if (!limits) return { config: { ...config } };
  const normalized = { ...config };
  for (const [key, maximum] of Object.entries(limits)) {
    if (!(key in normalized)) continue;
    const value = normalized[key];
    if (value === null || value === undefined) {
      normalized[key] = null;
      continue;
    }
    if (typeof value !== "string") {
      return { config: normalized, error: `${key} must be text.` };
    }
    const text = value.trim();
    if (text.length > maximum) {
      return {
        config: normalized,
        error: `${key} must be ${maximum} characters or fewer.`,
      };
    }
    normalized[key] = text || null;
  }
  return { config: normalized };
}

function requiredConfigString(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maximum ? normalized : null;
}

export function parseKawaiiGuaranteesConfig(
  config: Record<string, unknown>,
): KawaiiGuaranteesConfig | null {
  const accessibleLabel = requiredConfigString(config.accessible_label, 120);
  if (
    !accessibleLabel ||
    !Array.isArray(config.items) ||
    config.items.length !== 3
  ) {
    return null;
  }
  const items = config.items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const value = item as Record<string, unknown>;
    const title = requiredConfigString(value.title, 160);
    const body = requiredConfigString(value.body, 500);
    return title && body ? { title, body } : null;
  });
  if (items.some((item) => item === null)) return null;
  return {
    accessibleLabel,
    items: items as KawaiiGuaranteesConfig["items"],
  };
}

export function parseKawaiiStudioNotesConfig(
  config: Record<string, unknown>,
): KawaiiStudioNotesConfig | null {
  const eyebrow = requiredConfigString(config.eyebrow, 120);
  const ctaLabel = requiredConfigString(config.cta_label, 120);
  const ctaUrl = requiredConfigString(config.cta_url, 500);
  return eyebrow && ctaLabel && ctaUrl ? { eyebrow, ctaLabel, ctaUrl } : null;
}

export interface KawaiiAiSearchConfig {
  eyebrow: string;
  pillLabel: string | null;
  ctaLabel: string;
  imagePath: string | null;
  imageAlt: string | null;
}

export function parseKawaiiAiSearchConfig(
  config: Record<string, unknown>,
): KawaiiAiSearchConfig | null {
  const eyebrow = requiredConfigString(config.eyebrow, 120);
  const ctaLabel = requiredConfigString(config.cta_label, 120);
  if (!eyebrow || !ctaLabel) return null;
  const pillLabel = requiredConfigString(config.pill_label, 120);
  const imagePath = requiredConfigString(config.image_path, 500);
  const imageAlt = requiredConfigString(config.image_alt, 500);
  return { eyebrow, pillLabel, ctaLabel, imagePath, imageAlt };
}

export interface NormalizeHomepageSectionsOptions {
  appendMissing?: boolean;
}

export function normalizeHomepageSectionType(
  type: unknown,
): HomepageSectionType | null {
  if (type === "hero") return "banner";
  if (
    typeof type === "string" &&
    HOMEPAGE_SECTION_TYPES.includes(type as HomepageSectionType)
  ) {
    return type as HomepageSectionType;
  }
  return null;
}

export function getHomepageSectionMetadata(
  type: unknown,
): HomepageSectionMetadata | null {
  const normalizedType = normalizeHomepageSectionType(type);
  return normalizedType ? HOMEPAGE_SECTION_METADATA[normalizedType] : null;
}

export function getHomepageSectionFamily(
  type: unknown,
): HomepageSectionFamily | null {
  return getHomepageSectionMetadata(type)?.family ?? null;
}

export function getHomepageSectionVersion(type: unknown): 1 | 2 | null {
  return getHomepageSectionMetadata(type)?.version ?? null;
}

export function getHomepageSectionDisplayName(type: unknown): string | null {
  return getHomepageSectionMetadata(type)?.displayName ?? null;
}

export function normalizeHomepageSections(
  existing: readonly unknown[],
  options: NormalizeHomepageSectionsOptions = {},
): HomepageSectionRow[] {
  const seen = new Set<HomepageSectionType>();
  const normalized = existing
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const row = value as Partial<HomepageSectionRow>;
      const type = normalizeHomepageSectionType(row.type);
      if (
        !type ||
        seen.has(type) ||
        typeof row.id !== "string" ||
        typeof row.sort !== "number" ||
        !Number.isFinite(row.sort) ||
        typeof row.active !== "boolean" ||
        typeof row.created_at !== "string" ||
        typeof row.updated_at !== "string"
      ) {
        return null;
      }
      seen.add(type);
      return {
        ...row,
        type,
        title: typeof row.title === "string" ? row.title : null,
        subtitle: typeof row.subtitle === "string" ? row.subtitle : null,
        body: typeof row.body === "string" ? row.body : null,
        config:
          row.config &&
          typeof row.config === "object" &&
          !Array.isArray(row.config)
            ? { ...row.config }
            : {},
      } as HomepageSectionRow;
    })
    .filter((row): row is HomepageSectionRow => row !== null)
    .sort((a, b) => a.sort - b.sort);

  if (options.appendMissing === false) return normalized;
  if (normalized.length === 0) {
    return DEFAULT_HOMEPAGE_SECTIONS.map((row) => ({
      ...row,
      config: { ...row.config },
    }));
  }

  let nextSort = Math.max(...normalized.map((row) => row.sort)) + 1;
  for (const row of DEFAULT_HOMEPAGE_SECTIONS) {
    if (seen.has(row.type)) continue;
    seen.add(row.type);
    normalized.push({
      ...row,
      sort: nextSort,
      config: { ...row.config },
    });
    nextSort += 1;
  }

  return normalized;
}
