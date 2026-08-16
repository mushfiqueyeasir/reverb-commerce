import { describe, expect, it } from "vitest";
import { ABOUT_SECTION_TYPES } from "./aboutSections";
import {
  KAWAII_FASHION_ABOUT_RENDERER_PATHS,
  LEGACY_CLASSIC_ABOUT_RENDERER_PATHS,
  SOURCE_VERSION_ABOUT_RENDERER_PATHS,
  VOLT_GEAR_ABOUT_RENDERER_PATHS,
  createAboutRendererRegistry,
  resolveAboutRenderer,
  resolveAboutRendererId,
} from "./aboutRendererRegistry";

const V1_RENDERER_IDS = [
  "hero-v1",
  "stats-v1",
  "story-v1",
  "values-v1",
  "craft-v1",
  "cta-v1",
];

const V2_RENDERER_IDS = [
  "hero-v2",
  "stats-v2",
  "story-v2",
  "values-v2",
  "craft-v2",
  "cta-v2",
];

const KAWAII_RENDERER_IDS = [
  "kawaii-fashion.about.hero",
  "kawaii-fashion.about.stats",
  "kawaii-fashion.about.story",
  "kawaii-fashion.about.values",
  "kawaii-fashion.about.craft",
  "kawaii-fashion.about.cta",
];

describe("about renderer registry", () => {
  it("maps all 12 source types to Legacy V1 renderers", () => {
    expect(Object.keys(LEGACY_CLASSIC_ABOUT_RENDERER_PATHS)).toEqual(
      ABOUT_SECTION_TYPES,
    );
    expect(
      ABOUT_SECTION_TYPES.map(
        (type) => LEGACY_CLASSIC_ABOUT_RENDERER_PATHS[type],
      ),
    ).toEqual([...V1_RENDERER_IDS, ...V1_RENDERER_IDS]);
  });

  it("maps all 12 source types to Volt Gear renderers", () => {
    expect(Object.keys(VOLT_GEAR_ABOUT_RENDERER_PATHS)).toEqual(
      ABOUT_SECTION_TYPES,
    );
    expect(
      ABOUT_SECTION_TYPES.map(
        (type) => VOLT_GEAR_ABOUT_RENDERER_PATHS[type],
      ),
    ).toEqual([...V2_RENDERER_IDS, ...V2_RENDERER_IDS]);
  });

  it("maps all 12 source types to Kawaii Fashion renderers", () => {
    expect(Object.keys(KAWAII_FASHION_ABOUT_RENDERER_PATHS)).toEqual(
      ABOUT_SECTION_TYPES,
    );
    expect(
      ABOUT_SECTION_TYPES.map(
        (type) => KAWAII_FASHION_ABOUT_RENDERER_PATHS[type],
      ),
    ).toEqual([...KAWAII_RENDERER_IDS, ...KAWAII_RENDERER_IDS]);
  });

  it("falls back to a renderer matching the source version", () => {
    expect(resolveAboutRendererId("story", {})).toBe("story-v1");
    expect(resolveAboutRendererId("story_v2", {})).toBe("story-v2");
    expect(resolveAboutRendererId("hero_v2", { hero_v2: " " })).toBe(
      SOURCE_VERSION_ABOUT_RENDERER_PATHS.hero_v2,
    );
    expect(resolveAboutRendererId("missing", {})).toBeNull();
  });

  it("resolves mapped renderers with safe source-version fallbacks", () => {
    const registry = createAboutRendererRegistry(
      {
        "hero-v1": "source-v1",
        "hero-v2": "source-v2",
      },
      { "theme-hero": "theme" },
    );

    expect(resolveAboutRenderer("hero", registry, { hero: "theme-hero" })).toBe(
      "theme",
    );
    expect(
      resolveAboutRenderer("hero_v2", registry, {
        hero_v2: "missing-theme-renderer",
      }),
    ).toBe("source-v2");
    expect(resolveAboutRenderer("missing", registry)).toBeNull();
  });
});
