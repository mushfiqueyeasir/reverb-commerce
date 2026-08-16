import type { AboutSectionType } from "./aboutSections";
import { normalizeAboutSectionType } from "./aboutSections";

export type AboutRendererIdMapping = Partial<Record<AboutSectionType, string>>;

export type AboutRendererRegistry<Renderer> = Record<string, Renderer>;

export const SOURCE_VERSION_ABOUT_RENDERER_PATHS = {
  hero: "hero-v1",
  stats: "stats-v1",
  story: "story-v1",
  values: "values-v1",
  craft: "craft-v1",
  cta: "cta-v1",
  hero_v2: "hero-v2",
  stats_v2: "stats-v2",
  story_v2: "story-v2",
  values_v2: "values-v2",
  craft_v2: "craft-v2",
  cta_v2: "cta-v2",
} as const satisfies Record<AboutSectionType, string>;

export const LEGACY_CLASSIC_ABOUT_RENDERER_PATHS = {
  hero: "hero-v1",
  stats: "stats-v1",
  story: "story-v1",
  values: "values-v1",
  craft: "craft-v1",
  cta: "cta-v1",
  hero_v2: "hero-v1",
  stats_v2: "stats-v1",
  story_v2: "story-v1",
  values_v2: "values-v1",
  craft_v2: "craft-v1",
  cta_v2: "cta-v1",
} as const satisfies Record<AboutSectionType, string>;

export const VOLT_GEAR_ABOUT_RENDERER_PATHS = {
  hero: "hero-v2",
  stats: "stats-v2",
  story: "story-v2",
  values: "values-v2",
  craft: "craft-v2",
  cta: "cta-v2",
  hero_v2: "hero-v2",
  stats_v2: "stats-v2",
  story_v2: "story-v2",
  values_v2: "values-v2",
  craft_v2: "craft-v2",
  cta_v2: "cta-v2",
} as const satisfies Record<AboutSectionType, string>;

export const KAWAII_FASHION_ABOUT_RENDERER_PATHS = {
  hero: "kawaii-fashion.about.hero",
  stats: "kawaii-fashion.about.stats",
  story: "kawaii-fashion.about.story",
  values: "kawaii-fashion.about.values",
  craft: "kawaii-fashion.about.craft",
  cta: "kawaii-fashion.about.cta",
  hero_v2: "kawaii-fashion.about.hero",
  stats_v2: "kawaii-fashion.about.stats",
  story_v2: "kawaii-fashion.about.story",
  values_v2: "kawaii-fashion.about.values",
  craft_v2: "kawaii-fashion.about.craft",
  cta_v2: "kawaii-fashion.about.cta",
} as const satisfies Record<AboutSectionType, string>;

export function resolveAboutRendererId(
  type: unknown,
  mapping: AboutRendererIdMapping = {},
): string | null {
  const normalizedType = normalizeAboutSectionType(type);
  if (!normalizedType) return null;
  const rendererId = mapping[normalizedType];
  return typeof rendererId === "string" && rendererId.trim()
    ? rendererId
    : SOURCE_VERSION_ABOUT_RENDERER_PATHS[normalizedType];
}

export function resolveAboutRenderer<Renderer>(
  type: unknown,
  registry: AboutRendererRegistry<Renderer>,
  mapping: AboutRendererIdMapping = {},
): Renderer | null {
  const normalizedType = normalizeAboutSectionType(type);
  if (!normalizedType) return null;
  const rendererId = resolveAboutRendererId(normalizedType, mapping);
  const fallbackId = SOURCE_VERSION_ABOUT_RENDERER_PATHS[normalizedType];
  return (
    (rendererId ? registry[rendererId] : undefined) ??
    registry[fallbackId] ??
    null
  );
}

export function createAboutRendererRegistry<Renderer>(
  defaults: AboutRendererRegistry<Renderer>,
  overrides: Partial<AboutRendererRegistry<Renderer>> = {},
): AboutRendererRegistry<Renderer> {
  const registry = { ...defaults };
  for (const [rendererId, renderer] of Object.entries(overrides)) {
    if (renderer !== undefined) registry[rendererId] = renderer;
  }
  return registry;
}
