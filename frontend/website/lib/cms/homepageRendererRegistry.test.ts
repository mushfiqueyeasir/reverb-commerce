import { describe, expect, it } from "vitest";
import { HOMEPAGE_SECTION_TYPES } from "../../type/db";
import {
  LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS,
  V2_DESIGN_HOMEPAGE_RENDERER_PATHS,
  createHomepageRendererRegistry,
  resolveHomepageRenderer,
  resolveHomepageRendererId,
} from "./homepageRendererRegistry";

describe("homepage renderer registry", () => {
  it("provides a Legacy Classic dispatch path for all 14 section types", () => {
    expect(Object.keys(LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS)).toEqual(
      HOMEPAGE_SECTION_TYPES,
    );
    expect(
      HOMEPAGE_SECTION_TYPES.map(
        (type) => LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS[type],
      ),
    ).toEqual([
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

  it("provides a V2 Design dispatch path for all 14 section types", () => {
    expect(Object.keys(V2_DESIGN_HOMEPAGE_RENDERER_PATHS)).toEqual(
      HOMEPAGE_SECTION_TYPES,
    );
    expect(
      HOMEPAGE_SECTION_TYPES.map(
        (type) => V2_DESIGN_HOMEPAGE_RENDERER_PATHS[type],
      ),
    ).toEqual([
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

  it("accepts manifest renderer IDs and falls back for incomplete mappings", () => {
    expect(
      resolveHomepageRendererId("featured_v2", {
        featured_v2: "theme-featured",
      }),
    ).toBe("theme-featured");
    expect(resolveHomepageRendererId("reviews_v2", {})).toBe("reviews-classic");
    expect(resolveHomepageRendererId("hero", {})).toBe("banner-classic");
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
