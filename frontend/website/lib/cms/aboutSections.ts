import { ABOUT_INTRO_HTML } from "./defaultPageContent";

export type AboutSectionType =
  "hero" | "stats" | "story" | "values" | "craft" | "cta";

export const ABOUT_SECTION_TYPES: AboutSectionType[] = [
  "hero",
  "stats",
  "story",
  "values",
  "craft",
  "cta",
];

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

const now = () => new Date(0).toISOString();

export const DEFAULT_ABOUT_SECTIONS: AboutSectionRow[] = [
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
      cta_primary_label: "Shop products",
      cta_primary_url: "/product",
      cta_secondary_label: "Talk to us",
      cta_secondary_url: "/contact-us",
      image_path: "",
      image_bucket: "banner",
    },
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "about-stats",
    type: "stats",
    title: "Stats bar",
    sort: 1,
    active: true,
    config: {
      items: [
        { label: "Focus", value: "Quality" },
        { label: "Service", value: "Reliable" },
        { label: "Design", value: "Considered" },
        { label: "Community", value: "Growing" },
      ] satisfies AboutStatItem[],
    },
    created_at: now(),
    updated_at: now(),
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
      image_path: "",
      image_bucket: "banner",
    },
    created_at: now(),
    updated_at: now(),
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
    created_at: now(),
    updated_at: now(),
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
    created_at: now(),
    updated_at: now(),
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
      cta_primary_label: "Explore products",
      cta_primary_url: "/product",
      cta_secondary_label: "See community",
      cta_secondary_url: "/reviews",
    },
    created_at: now(),
    updated_at: now(),
  },
];

export function ensureAboutSections(
  existing: AboutSectionRow[],
): AboutSectionRow[] {
  const byType = new Map(existing.map((s) => [s.type, s]));
  const merged = DEFAULT_ABOUT_SECTIONS.map((def, index) => {
    const cur = byType.get(def.type);
    if (!cur) return { ...def, sort: index };
    return {
      ...def,
      ...cur,
      type: def.type,
      id: cur.id || def.id,
      sort: typeof cur.sort === "number" ? cur.sort : index,
      config: { ...def.config, ...(cur.config ?? {}) },
    };
  });
  return merged.sort((a, b) => a.sort - b.sort);
}
