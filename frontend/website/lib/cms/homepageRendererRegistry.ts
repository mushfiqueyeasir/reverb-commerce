import type { HomepageSectionType } from "../../type/db";
import { normalizeHomepageSectionType } from "./homepageSections";

export type HomepageRendererIdMapping = Partial<
  Record<HomepageSectionType, string>
>;

export type HomepageRendererRegistry<Renderer> = Record<string, Renderer>;

export const LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS = {
  banner: "banner-classic",
  categories: "categories-classic",
  deals: "featured-classic",
  new_arrivals: "featured-classic",
  featured: "featured-classic",
  reviews: "reviews-classic",
  promo: "promo-classic",
  richtext: "richtext-classic",
  banner_v2: "banner-classic",
  categories_v2: "categories-classic",
  featured_v2: "featured-classic",
  reviews_v2: "reviews-classic",
  promo_v2: "promo-classic",
  richtext_v2: "richtext-classic",
} as const satisfies HomepageRendererIdMapping;

export const VOLT_GEAR_HOMEPAGE_RENDERER_PATHS = {
  banner: "banner-v2",
  categories: "categories-v2",
  deals: "volt-gear.featured",
  new_arrivals: "volt-gear.featured",
  featured: "volt-gear.featured",
  reviews: "reviews-v2",
  promo: "promo-v2",
  richtext: "richtext-v2",
  banner_v2: "banner-v2",
  categories_v2: "categories-v2",
  featured_v2: "volt-gear.featured",
  reviews_v2: "reviews-v2",
  promo_v2: "promo-v2",
  richtext_v2: "richtext-v2",
} as const satisfies HomepageRendererIdMapping;

export const KAWAII_FASHION_HOMEPAGE_RENDERER_PATHS = {
  banner: "kawaii-fashion.banner",
  categories: "kawaii-fashion.categories",
  deals: "kawaii-fashion.featured",
  new_arrivals: "kawaii-fashion.featured",
  featured: "kawaii-fashion.featured",
  reviews: "kawaii-fashion.reviews",
  promo: "kawaii-fashion.promo",
  richtext: "kawaii-fashion.story",
  banner_v2: "kawaii-fashion.banner",
  categories_v2: "kawaii-fashion.categories",
  featured_v2: "kawaii-fashion.featured",
  reviews_v2: "kawaii-fashion.reviews",
  promo_v2: "kawaii-fashion.promo",
  richtext_v2: "kawaii-fashion.story",
  guarantees: "kawaii-fashion.guarantees",
  studio_notes: "kawaii-fashion.studio-notes",
  ai_search: "kawaii-fashion.ai-search",
} as const satisfies HomepageRendererIdMapping;

export function resolveHomepageRendererId(
  type: unknown,
  mapping: HomepageRendererIdMapping = {},
): string | null {
  const normalizedType = normalizeHomepageSectionType(type);
  if (!normalizedType) return null;
  const rendererId = mapping[normalizedType];
  if (typeof rendererId === "string" && rendererId.trim()) return rendererId;
  const legacyMapping: HomepageRendererIdMapping =
    LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS;
  return legacyMapping[normalizedType] ?? null;
}

export function resolveHomepageRenderer<Renderer>(
  type: unknown,
  registry: HomepageRendererRegistry<Renderer>,
  mapping: HomepageRendererIdMapping = {},
): Renderer | null {
  const normalizedType = normalizeHomepageSectionType(type);
  if (!normalizedType) return null;
  const rendererId = resolveHomepageRendererId(normalizedType, mapping);
  const legacyMapping: HomepageRendererIdMapping =
    LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS;
  const fallbackId = legacyMapping[normalizedType];
  return (
    (rendererId ? registry[rendererId] : undefined) ??
    (fallbackId ? registry[fallbackId] : undefined) ??
    null
  );
}

export function createHomepageRendererRegistry<Renderer>(
  defaults: HomepageRendererRegistry<Renderer>,
  overrides: Partial<HomepageRendererRegistry<Renderer>> = {},
): HomepageRendererRegistry<Renderer> {
  const registry = { ...defaults };
  for (const [rendererId, renderer] of Object.entries(overrides)) {
    if (renderer !== undefined) registry[rendererId] = renderer;
  }
  return registry;
}
