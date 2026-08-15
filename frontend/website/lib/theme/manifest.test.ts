import { describe, expect, it } from "vitest";
import { HOMEPAGE_SECTION_TYPES } from "../../type/db";
import {
  AVAILABLE_STOREFRONT_THEMES,
  LEGACY_CLASSIC_THEME,
  createDefaultStorefrontThemeConfig,
  normalizeStorefrontThemeConfig,
  normalizeStorefrontThemeConfigWithResult,
  resolveStorefrontThemeTokens,
} from "./manifest";

const validConfig = {
  schemaVersion: 1,
  themeId: "legacy-classic",
  themeVersion: 1,
  tokenOverrides: {},
};

describe("storefront theme manifest", () => {
  it("exposes only Legacy Classic", () => {
    expect(AVAILABLE_STOREFRONT_THEMES).toHaveLength(1);
    expect(AVAILABLE_STOREFRONT_THEMES[0].id).toBe("legacy-classic");
  });

  it("maps all 14 homepage section renderers", () => {
    const mappings = LEGACY_CLASSIC_THEME.renderers.homepageSections;

    expect(HOMEPAGE_SECTION_TYPES).toHaveLength(14);
    expect(Object.keys(mappings).sort()).toEqual(
      [...HOMEPAGE_SECTION_TYPES].sort(),
    );
    expect(mappings).toEqual({
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
    });
  });
});

describe("normalizeStorefrontThemeConfig", () => {
  it.each([null, [], "legacy-classic", 3, { themeId: "legacy-classic" }])(
    "safely normalizes malformed data %#",
    (raw) => {
      expect(normalizeStorefrontThemeConfig(raw)).toEqual(
        createDefaultStorefrontThemeConfig(),
      );
      expect(normalizeStorefrontThemeConfigWithResult(raw).usedFallback).toBe(
        true,
      );
    },
  );

  it("falls back to Legacy Classic for an unknown theme", () => {
    const result = normalizeStorefrontThemeConfigWithResult({
      ...validConfig,
      themeId: "missing-theme",
    });

    expect(result.usedFallback).toBe(true);
    expect(result.config).toEqual(createDefaultStorefrontThemeConfig());
    expect(result.errors).toContain("Theme is unknown or unavailable.");
  });

  it("rejects theme versions that are not installed in the versioned registry", () => {
    const result = normalizeStorefrontThemeConfigWithResult({
      ...validConfig,
      themeVersion: 2,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.errors).toContain("Theme version is unsupported.");
  });

  it("normalizes valid token overrides and drops malformed values", () => {
    const result = normalizeStorefrontThemeConfigWithResult({
      ...validConfig,
      tokenOverrides: {
        palette: {
          primary: " #ABC ",
          background: "javascript:red",
          border: "#123456",
          unknown: "#ffffff",
        },
      },
    });

    expect(result.usedFallback).toBe(false);
    expect(result.config.tokenOverrides.palette).toEqual({
      primary: "#aabbcc",
      border: "#123456",
    });
    expect(result.errors).toContain(
      "One or more theme palette overrides are invalid.",
    );
    expect(resolveStorefrontThemeTokens(result.config).palette.background).toBe(
      LEGACY_CLASSIC_THEME.defaultTokens.palette.background,
    );
  });
});
