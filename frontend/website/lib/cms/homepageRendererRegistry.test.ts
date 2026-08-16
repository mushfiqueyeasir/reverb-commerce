import { describe, expect, it } from "vitest";
import { HOMEPAGE_SECTION_TYPES } from "../../type/db";
import {
  KAWAII_FASHION_HOMEPAGE_RENDERER_PATHS,
  LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS,
  VOLT_GEAR_HOMEPAGE_RENDERER_PATHS,
  createHomepageRendererRegistry,
  resolveHomepageRenderer,
  resolveHomepageRendererId,
} from "./homepageRendererRegistry";

describe("homepage renderer registry", () => {
  it("provides Legacy Classic dispatch paths only for supported types", () => {
    expect(Object.keys(LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS)).toEqual(
      HOMEPAGE_SECTION_TYPES.slice(0, 14),
    );
    expect(Object.values(LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS)).toEqual([
      "banner-classic",
      "categories-classic",
      "featured-classic",
      "featured-classic",
      "featured-classic",
      "reviews-classic",
      "promo-classic",
      "richtext-classic",
      "banner-classic",
      "categories-classic",
      "featured-classic",
      "reviews-classic",
      "promo-classic",
      "richtext-classic",
    ]);
  });

  it("provides Volt Gear dispatch paths only for supported types", () => {
    expect(Object.keys(VOLT_GEAR_HOMEPAGE_RENDERER_PATHS)).toEqual(
      HOMEPAGE_SECTION_TYPES.slice(0, 14),
    );
    expect(Object.values(VOLT_GEAR_HOMEPAGE_RENDERER_PATHS)).toEqual([
      "banner-v2",
      "categories-v2",
      "featured-v2",
      "featured-v2",
      "featured-v2",
      "reviews-v2",
      "promo-v2",
      "richtext-v2",
      "banner-v2",
      "categories-v2",
      "featured-v2",
      "reviews-v2",
      "promo-v2",
      "richtext-v2",
    ]);
  });

  it("provides a Kawaii Fashion dispatch path for all 17 section types", () => {
    expect(Object.keys(KAWAII_FASHION_HOMEPAGE_RENDERER_PATHS)).toEqual(
      HOMEPAGE_SECTION_TYPES,
    );
    expect(
      HOMEPAGE_SECTION_TYPES.map(
        (type) => KAWAII_FASHION_HOMEPAGE_RENDERER_PATHS[type],
      ),
    ).toEqual([
      "kawaii-fashion.banner",
      "kawaii-fashion.categories",
      "kawaii-fashion.featured",
      "kawaii-fashion.featured",
      "kawaii-fashion.featured",
      "kawaii-fashion.reviews",
      "kawaii-fashion.promo",
      "kawaii-fashion.story",
      "kawaii-fashion.banner",
      "kawaii-fashion.categories",
      "kawaii-fashion.featured",
      "kawaii-fashion.reviews",
      "kawaii-fashion.promo",
      "kawaii-fashion.story",
      "kawaii-fashion.guarantees",
      "kawaii-fashion.studio-notes",
      "kawaii-fashion.ai-search",
    ]);
  });

  it("accepts manifest renderer IDs and falls back for incomplete mappings", () => {
    expect(
      resolveHomepageRendererId("featured_v2", {
        featured_v2: "theme-featured",
      }),
    ).toBe("theme-featured");
    expect(resolveHomepageRendererId("reviews_v2", {})).toBe("reviews-classic");
    expect(resolveHomepageRendererId("hero", {})).toBe("banner-classic");
    expect(resolveHomepageRendererId("guarantees", {})).toBeNull();
    expect(resolveHomepageRendererId("video", {})).toBeNull();
  });

  it("combines theme renderers with safe Legacy Classic fallbacks", () => {
    const registry = createHomepageRendererRegistry(
      {
        "featured-classic": "legacy-featured",
        "reviews-classic": "legacy-reviews",
      },
      { "theme-featured": "theme-featured" },
    );

    expect(
      resolveHomepageRenderer("featured_v2", registry, {
        featured_v2: "theme-featured",
      }),
    ).toBe("theme-featured");
    expect(
      resolveHomepageRenderer("reviews_v2", registry, {
        reviews_v2: "missing-theme-reviews",
      }),
    ).toBe("legacy-reviews");
    expect(resolveHomepageRenderer("video", registry)).toBeNull();
  });
});
