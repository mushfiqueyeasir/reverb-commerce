import { ABOUT_INTRO_HTML } from "./defaultPageContent";

export type AboutSectionFamily =
  "hero" | "stats" | "story" | "values" | "craft" | "cta";

export type AboutSectionV1Type = AboutSectionFamily;
export type AboutSectionV2Type = `${AboutSectionFamily}_v2`;
export type AboutSectionType = AboutSectionV1Type | AboutSectionV2Type;

export const ABOUT_SECTION_TYPES: AboutSectionType[] = [
  "hero",
  "stats",
  "story",
  "values",
  "craft",
  "cta",
  "hero_v2",
  "stats_v2",
  "story_v2",
  "values_v2",
  "craft_v2",
  "cta_v2",
];

export interface AboutSectionMetadata {
  family: AboutSectionFamily;
  version: 1 | 2;
  displayName: string;
}

export const ABOUT_SECTION_METADATA: Record<
  AboutSectionType,
  AboutSectionMetadata
> = {
  hero: { family: "hero", version: 1, displayName: "Hero - Classic" },
  stats: { family: "stats", version: 1, displayName: "Stats - Strip" },
  story: { family: "story", version: 1, displayName: "Story - Split" },
  values: { family: "values", version: 1, displayName: "Values - Cards" },
  craft: { family: "craft", version: 1, displayName: "Craft - Workshop" },
  cta: { family: "cta", version: 1, displayName: "CTA - Community" },
  hero_v2: { family: "hero", version: 2, displayName: "Hero - Manifesto" },
  stats_v2: {
    family: "stats",
    version: 2,
    displayName: "Stats - Signal Grid",
  },
  story_v2: {
    family: "story",
    version: 2,
    displayName: "Story - Editorial",
  },
  values_v2: {
    family: "values",
    version: 2,
    displayName: "Values - Principles Index",
  },
  craft_v2: {
    family: "craft",
    version: 2,
    displayName: "Craft - Blueprint",
  },
  cta_v2: { family: "cta", version: 2, displayName: "CTA - Portal" },
};

export interface AboutStatItem {
  label: string;
  value: string;
}

export interface AboutValueItem {
  title: string;
  body: string;
}

export interface AboutCraftItem {
  label: string;
  sub: string;
  icon: string;
}

export interface AboutSectionRow {
  id: string;
  type: AboutSectionType;
  title: string | null;
  sort: number;
  active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const epoch = new Date(0).toISOString();

const V1_ABOUT_SECTIONS: AboutSectionRow[] = [
  {
    id: "about-hero",
    type: "hero",
    title: "Hero",
    sort: 0,
    active: true,
    config: {
      eyebrow: "Our story",
      headline_line1: "Designed with purpose.",
      headline_line2: "Made for everyday life.",
      subtitle:
        "Thoughtful products, dependable quality, and a collection built around the people who use it.",
      accessible_label: "About the store",
      image_alt: "Store collection",
      cta_primary_label: "Shop products",
      cta_primary_url: "/product",
      cta_secondary_label: "Talk to us",
      cta_secondary_url: "/contact-us",
      image_path: "",
      image_bucket: "banner",
    },
    created_at: epoch,
    updated_at: epoch,
  },
  {
    id: "about-stats",
    type: "stats",
    title: "Stats bar",
    sort: 1,
    active: true,
    config: {
      accessible_label: "Highlights",
      items: [
        { label: "Focus", value: "Quality" },
        { label: "Service", value: "Reliable" },
        { label: "Design", value: "Considered" },
        { label: "Community", value: "Growing" },
      ] satisfies AboutStatItem[],
    },
    created_at: epoch,
    updated_at: epoch,
  },
  {
    id: "about-story",
    type: "story",
    title: "Story",
    sort: 2,
    active: true,
    config: {
      eyebrow: "Why we exist",
      title: "Products made with intent.",
      body_html: ABOUT_INTRO_HTML,
      extra:
        "This is placeholder story content. Replace it with the people, purpose, and standards behind your store before launch.",
      accessible_label: "Our story",
      image_alt: "Store story",
      image_path: "",
      image_bucket: "banner",
    },
    created_at: epoch,
    updated_at: epoch,
  },
  {
    id: "about-values",
    type: "values",
    title: "Values",
    sort: 3,
    active: true,
    config: {
      eyebrow: "What we stand for",
      title: "Quality over noise.",
      accessible_label: "Our values",
      items: [
        {
          title: "Built to perform",
          body: "Materials, construction, and details selected for dependable everyday use.",
        },
        {
          title: "Designed with intent",
          body: "Clear choices and considered details instead of disposable design.",
        },
        {
          title: "Made to last",
          body: "We focus on dependable products and clear information so customers can choose with confidence.",
        },
      ] satisfies AboutValueItem[],
    },
    created_at: epoch,
    updated_at: epoch,
  },
  {
    id: "about-craft",
    type: "craft",
    title: "Craft / fabric",
    sort: 4,
    active: true,
    config: {
      eyebrow: "Product standards",
      title_line1: "Every detail",
      title_line2: "considered.",
      body: "This is placeholder material copy. Explain the actual materials, production process, and quality checks used by your store.",
      accessible_label: "Our craft",
      image_alt: "Product detail",
      image_path: "",
      image_bucket: "branding",
      fabric_label: "Product",
      fabric_value: "Update this detail",
      fabric_tag: "// DETAIL",
      items: [
        { icon: "Layers", label: "Materials", sub: "Add product details" },
        {
          icon: "Shirt",
          label: "Construction",
          sub: "Explain how it is made",
        },
        { icon: "Scissors", label: "Design", sub: "Describe key choices" },
        { icon: "Zap", label: "Performance", sub: "State practical benefits" },
        { icon: "Sparkles", label: "Care", sub: "Add care guidance" },
        { icon: "Award", label: "Quality", sub: "Explain quality checks" },
      ] satisfies AboutCraftItem[],
    },
    created_at: epoch,
    updated_at: epoch,
  },
  {
    id: "about-cta",
    type: "cta",
    title: "Community CTA",
    sort: 5,
    active: true,
    config: {
      eyebrow: "Community",
      title: "Join a community that values quality.",
      body: "When you choose our store, you join people who value thoughtful products and dependable service. Thank you for being here.",
      accessible_label: "Continue exploring",
      cta_primary_label: "Explore products",
      cta_primary_url: "/product",
      cta_secondary_label: "See community",
      cta_secondary_url: "/reviews",
    },
    created_at: epoch,
    updated_at: epoch,
  },
];

function cloneConfig(config: Record<string, unknown>): Record<string, unknown> {
  const items = config.items;
  return {
    ...config,
    ...(Array.isArray(items)
      ? {
          items: items.map((item) =>
            item && typeof item === "object" && !Array.isArray(item)
              ? { ...(item as Record<string, unknown>) }
              : item,
          ),
        }
      : {}),
  };
}

const V2_ABOUT_SECTIONS: AboutSectionRow[] = V1_ABOUT_SECTIONS.map(
  (section, index) => ({
    ...section,
    id: `${section.id}-v2`,
    type: `${section.type}_v2` as AboutSectionV2Type,
    title: `${section.title ?? section.type} V2`,
    sort: V1_ABOUT_SECTIONS.length + index,
    active: false,
    config: cloneConfig(section.config),
  }),
);

export const DEFAULT_ABOUT_SECTIONS: AboutSectionRow[] = [
  ...V1_ABOUT_SECTIONS,
  ...V2_ABOUT_SECTIONS,
];

const sectionTypeSet = new Set<string>(ABOUT_SECTION_TYPES);
const defaultsByType = new Map(
  DEFAULT_ABOUT_SECTIONS.map((section) => [section.type, section]),
);

export function normalizeAboutSectionType(
  value: unknown,
): AboutSectionType | null {
  return typeof value === "string" && sectionTypeSet.has(value)
    ? (value as AboutSectionType)
    : null;
}

export function getAboutSectionMetadata(
  value: unknown,
): AboutSectionMetadata | null {
  const type = normalizeAboutSectionType(value);
  return type ? ABOUT_SECTION_METADATA[type] : null;
}

export function getAboutSectionFamily(
  value: unknown,
): AboutSectionFamily | null {
  return getAboutSectionMetadata(value)?.family ?? null;
}

export function getAboutSectionVersion(value: unknown): 1 | 2 | null {
  return getAboutSectionMetadata(value)?.version ?? null;
}

export function getAboutSectionDisplayName(value: unknown): string | null {
  return getAboutSectionMetadata(value)?.displayName ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeAboutSections(
  existing: unknown[],
  options: { appendMissing?: boolean } = {},
): AboutSectionRow[] {
  const appendMissing = options.appendMissing ?? true;
  const seenTypes = new Set<AboutSectionType>();
  const seenIds = new Set<string>();
  const normalized: AboutSectionRow[] = [];

  for (const value of existing) {
    if (!isRecord(value)) continue;
    const type = normalizeAboutSectionType(value.type);
    const id = typeof value.id === "string" ? value.id.trim() : "";
    if (!type || !id || seenTypes.has(type) || seenIds.has(id)) continue;
    if (typeof value.sort !== "number" || !Number.isFinite(value.sort))
      continue;
    if (typeof value.active !== "boolean") continue;

    const defaults = defaultsByType.get(type)!;
    const config = isRecord(value.config) ? value.config : {};
    normalized.push({
      id,
      type,
      title:
        typeof value.title === "string" || value.title === null
          ? value.title
          : defaults.title,
      sort: value.sort,
      active: value.active,
      config: { ...cloneConfig(defaults.config), ...cloneConfig(config) },
      created_at:
        typeof value.created_at === "string" ? value.created_at : epoch,
      updated_at:
        typeof value.updated_at === "string" ? value.updated_at : epoch,
    });
    seenTypes.add(type);
    seenIds.add(id);
  }

  normalized.sort((a, b) => a.sort - b.sort);
  if (!appendMissing) return normalized;
  if (normalized.length === 0) {
    return DEFAULT_ABOUT_SECTIONS.map((section) => ({
      ...section,
      config: cloneConfig(section.config),
    }));
  }

  let nextSort = Math.max(...normalized.map((section) => section.sort)) + 1;
  for (const defaults of DEFAULT_ABOUT_SECTIONS) {
    if (seenTypes.has(defaults.type) || seenIds.has(defaults.id)) continue;
    normalized.push({
      ...defaults,
      sort: nextSort++,
      config: cloneConfig(defaults.config),
    });
  }

  return normalized;
}

export function ensureAboutSections(existing: unknown[]): AboutSectionRow[] {
  return normalizeAboutSections(existing);
}
