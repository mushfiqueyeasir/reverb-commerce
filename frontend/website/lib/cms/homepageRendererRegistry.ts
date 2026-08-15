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
  banner_v2: "banner-v2",
  categories_v2: "categories-v2",
  featured_v2: "featured-v2",
  reviews_v2: "reviews-v2",
  promo_v2: "promo-v2",
  richtext_v2: "richtext-v2",
} as const satisfies Record<HomepageSectionType, string>;

export function resolveHomepageRendererId(
  type: unknown,
  mapping: HomepageRendererIdMapping = {},
): string | null {
  const normalizedType = normalizeHomepageSectionType(type);
  if (!normalizedType) return null;
  const rendererId = mapping[normalizedType];
  return typeof rendererId === "string" && rendererId.trim()
    ? rendererId
    : LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS[normalizedType];
}

export function resolveHomepageRenderer<Renderer>(
  type: unknown,
  registry: HomepageRendererRegistry<Renderer>,
  mapping: HomepageRendererIdMapping = {},
): Renderer | null {
  const normalizedType = normalizeHomepageSectionType(type);
  if (!normalizedType) return null;
  const rendererId = resolveHomepageRendererId(normalizedType, mapping);
  const fallbackId = LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS[normalizedType];
  return (
    (rendererId ? registry[rendererId] : undefined) ??
    registry[fallbackId] ??
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
