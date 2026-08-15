import { describe, expect, it } from "vitest";
import { HOMEPAGE_SECTION_TYPES } from "../../type/db";
import { ABOUT_SECTION_TYPES } from "../cms/aboutSections";
import { DEFAULT_PALETTE } from "./palette";
import {
  AVAILABLE_STOREFRONT_THEMES,
  LEGACY_CLASSIC_THEME,
  THEME_ABOUT_SECTION_TYPES,
  THEME_HOMEPAGE_SECTION_TYPES,
  V2_DESIGN_THEME,
  createDefaultStorefrontThemeConfig,
  getStorefrontThemeManifest,
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

const LEGACY_HOMEPAGE_MAPPING = {
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
};

const V2_HOMEPAGE_MAPPING = {
  banner: "banner-v2",
  categories: "categories-v2",
  deals: "featured-v2",
  new_arrivals: "featured-v2",
  featured: "featured-v2",
  reviews: "reviews-v2",
  promo: "promo-v2",
  richtext: "richtext-v2",
  banner_v2: "banner-v2",
  categories_v2: "categories-v2",
  featured_v2: "featured-v2",
  reviews_v2: "reviews-v2",
  promo_v2: "promo-v2",
  richtext_v2: "richtext-v2",
};

const LEGACY_ABOUT_MAPPING = {
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
};

const V2_ABOUT_MAPPING = {
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
};

describe("storefront theme manifest", () => {
  it("exposes exactly two complete version 1 theme packages", () => {
    expect(AVAILABLE_STOREFRONT_THEMES).toHaveLength(2);
    expect(
      AVAILABLE_STOREFRONT_THEMES.map(({ id, version }) => ({ id, version })),
    ).toEqual([
      { id: "legacy-classic", version: 1 },
      { id: "v2-design", version: 1 },
    ]);
    expect(LEGACY_CLASSIC_THEME.displayName).toBe("Tee Drop Classic");
    expect(LEGACY_CLASSIC_THEME.id).toBe("legacy-classic");
    expect(LEGACY_CLASSIC_THEME.defaultTokens.palette).toEqual(DEFAULT_PALETTE);
    expect(V2_DESIGN_THEME.defaultTokens.palette).toEqual(DEFAULT_PALETTE);
    expect(LEGACY_CLASSIC_THEME.renderers.navbar).toBe("legacy-classic.navbar");
    expect(LEGACY_CLASSIC_THEME.renderers.footer).toBe("legacy-classic.footer");
    expect(V2_DESIGN_THEME.renderers.navbar).toBe("v2-design.navbar");
    expect(V2_DESIGN_THEME.renderers.footer).toBe("v2-design.footer");
    expect(THEME_HOMEPAGE_SECTION_TYPES).toEqual([
      "banner",
      "featured",
      "categories",
      "richtext",
      "reviews",
      "promo",
    ]);
    expect(THEME_ABOUT_SECTION_TYPES).toEqual([
      "hero",
      "stats",
      "story",
      "values",
      "craft",
      "cta",
    ]);
  });

  it.each([
    [LEGACY_CLASSIC_THEME, LEGACY_HOMEPAGE_MAPPING, LEGACY_ABOUT_MAPPING],
    [V2_DESIGN_THEME, V2_HOMEPAGE_MAPPING, V2_ABOUT_MAPPING],
  ])(
    "maps every homepage and About source type for $id",
    (theme, homepage, about) => {
      expect(HOMEPAGE_SECTION_TYPES).toHaveLength(14);
      expect(Object.keys(theme.renderers.homepageSections).sort()).toEqual(
        [...HOMEPAGE_SECTION_TYPES].sort(),
      );
      expect(theme.renderers.homepageSections).toEqual(homepage);
      expect(ABOUT_SECTION_TYPES).toHaveLength(12);
      expect(Object.keys(theme.renderers.aboutSections).sort()).toEqual(
        [...ABOUT_SECTION_TYPES].sort(),
      );
      expect(theme.renderers.aboutSections).toEqual(about);
      expect(theme.slots.homepage.sectionTypes).toEqual(
        THEME_HOMEPAGE_SECTION_TYPES,
      );
      expect(theme.slots.about.sectionTypes).toEqual(THEME_ABOUT_SECTION_TYPES);
      expect(theme.compatibility.aboutSectionVersions).toEqual([1, 2]);
    },
  );

  it("falls back to Legacy Classic for unknown manifests", () => {
    expect(getStorefrontThemeManifest("missing-theme")).toBe(
      LEGACY_CLASSIC_THEME,
    );
    expect(getStorefrontThemeManifest("v2-design", 2)).toBe(
      LEGACY_CLASSIC_THEME,
    );
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

  it("accepts V2 Design version 1", () => {
    const result = normalizeStorefrontThemeConfigWithResult({
      ...validConfig,
      themeId: "v2-design",
    });

    expect(result.usedFallback).toBe(false);
    expect(result.errors).toEqual([]);
    expect(result.config.themeId).toBe("v2-design");
  });

  it("rejects theme versions that are not installed", () => {
    const result = normalizeStorefrontThemeConfigWithResult({
      ...validConfig,
      themeVersion: 2,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.errors).toContain("Theme version is unsupported.");
  });

  it("normalizes only primary and drops every other palette key", () => {
    const result = normalizeStorefrontThemeConfigWithResult({
      ...validConfig,
      tokenOverrides: {
        palette: {
          primary: " #ABC ",
          primaryForeground: "#ffffff",
          background: "#ffffff",
          border: "#123456",
          unknown: "#ffffff",
        },
      },
    });

    expect(result.usedFallback).toBe(false);
    expect(result.config.tokenOverrides.palette).toEqual({
      primary: "#aabbcc",
    });
    expect(result.errors).toContain(
      "One or more theme palette overrides are invalid.",
    );
  });

  it("always resolves non-primary tokens from the selected theme defaults", () => {
    const config = {
      ...createDefaultStorefrontThemeConfig(V2_DESIGN_THEME),
      tokenOverrides: {
        palette: {
          primary: "#123456",
          background: "#ffffff",
          border: "#ffffff",
        },
      },
    } as Parameters<typeof resolveStorefrontThemeTokens>[0];
    const palette = resolveStorefrontThemeTokens(config).palette;

    expect(palette.primary).toBe("#123456");
    expect(palette).toEqual({
      ...V2_DESIGN_THEME.defaultTokens.palette,
      primary: "#123456",
    });
  });
});
