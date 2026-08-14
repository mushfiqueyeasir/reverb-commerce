import {
  DEFAULT_HOMEPAGE_SECTIONS,
  HOMEPAGE_SECTION_TYPES,
  type HomepageSectionRow,
  type HomepageSectionType,
  type HomepageSectionV1Type,
} from "../../type/db";

export type HomepageProductSelection = "featured" | "deals" | "new-arrivals";

export interface HomepageSectionMetadata {
  family: HomepageSectionV1Type;
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
};

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
): HomepageSectionV1Type | null {
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
