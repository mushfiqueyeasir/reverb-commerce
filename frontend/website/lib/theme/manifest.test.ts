import { describe, expect, it } from "vitest";
import { HOMEPAGE_SECTION_TYPES } from "../../type/db";
import { ABOUT_SECTION_TYPES } from "../cms/aboutSections";
import { KAWAII_FASHION_ABOUT_RENDERER_PATHS } from "../cms/aboutRendererRegistry";
import { KAWAII_FASHION_HOMEPAGE_RENDERER_PATHS } from "../cms/homepageRendererRegistry";
import {
  DEFAULT_PALETTE,
  KAWAII_WHITE_PALETTE,
  MINICO_BURGUNDY_PALETTE,
  accessiblePrimaryForeground,
  relativeLuminance,
} from "./palette";
import {
  AVAILABLE_STOREFRONT_THEMES,
  KAWAII_FASHION_HOMEPAGE_SECTION_TYPES,
  KAWAII_FASHION_SHAPE,
  KAWAII_FASHION_THEME,
  LEGACY_CLASSIC_SHAPE,
  LEGACY_CLASSIC_THEME,
  STOREFRONT_THEME_REGISTRY,
  THEME_ABOUT_SECTION_TYPES,
  THEME_HOMEPAGE_SECTION_TYPES,
  VOLT_GEAR_HOMEPAGE_SECTION_TYPES,
  VOLT_GEAR_SHAPE,
  VOLT_GEAR_THEME,
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
  it("exposes exactly three complete version 1 theme packages", () => {
    expect(AVAILABLE_STOREFRONT_THEMES).toHaveLength(3);
    expect(
      AVAILABLE_STOREFRONT_THEMES.map(({ id, version }) => ({ id, version })),
    ).toEqual([
      { id: "legacy-classic", version: 1 },
      { id: "volt-gear", version: 1 },
      { id: "kawaii-fashion", version: 1 },
    ]);
    expect(LEGACY_CLASSIC_THEME.displayName).toBe("Tee Drop Classic");
    expect(LEGACY_CLASSIC_THEME.id).toBe("legacy-classic");
    expect(KAWAII_FASHION_THEME.displayName).toBe("Kawaii Fashion");
    expect(KAWAII_FASHION_THEME.id).toBe("kawaii-fashion");
    expect(VOLT_GEAR_THEME.displayName).toBe("Volt Gear");
    expect(VOLT_GEAR_THEME.id).toBe("volt-gear");
    expect(LEGACY_CLASSIC_THEME.defaultTokens.palette).toEqual(DEFAULT_PALETTE);
    expect(VOLT_GEAR_THEME.defaultTokens.palette).toEqual(
      MINICO_BURGUNDY_PALETTE,
    );
    expect(KAWAII_FASHION_THEME.defaultTokens.palette).toEqual({
      ...KAWAII_WHITE_PALETTE,
      primaryForeground: "#050505",
    });
    expect(LEGACY_CLASSIC_THEME.defaultTokens.shape).toEqual(
      LEGACY_CLASSIC_SHAPE,
    );
    expect(VOLT_GEAR_THEME.defaultTokens.shape).toEqual(VOLT_GEAR_SHAPE);
    expect(KAWAII_FASHION_THEME.defaultTokens.shape).toEqual(
      KAWAII_FASHION_SHAPE,
    );
    expect(LEGACY_CLASSIC_THEME.renderers.navbar).toBe("legacy-classic.navbar");
    expect(LEGACY_CLASSIC_THEME.renderers.footer).toBe("legacy-classic.footer");
    expect(VOLT_GEAR_THEME.renderers.navbar).toBe("volt-gear.navbar");
    expect(VOLT_GEAR_THEME.renderers.footer).toBe("volt-gear.footer");
    expect(KAWAII_FASHION_THEME.renderers.navbar).toBe("kawaii-fashion.navbar");
    expect(KAWAII_FASHION_THEME.renderers.footer).toBe("kawaii-fashion.footer");
    expect(THEME_HOMEPAGE_SECTION_TYPES).toEqual([
      "banner",
      "featured",
      "categories",
      "richtext",
      "reviews",
      "promo",
    ]);
    expect(VOLT_GEAR_HOMEPAGE_SECTION_TYPES).toEqual([
      "banner",
      "categories",
      "deals",
      "new_arrivals",
      "featured",
      "richtext",
      "reviews",
      "promo",
    ]);
    expect(KAWAII_FASHION_HOMEPAGE_SECTION_TYPES).toEqual([
      "banner",
      "categories",
      "deals",
      "new_arrivals",
      "featured",
      "richtext",
      "reviews",
      "promo",
      "guarantees",
      "studio_notes",
      "ai_search",
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

  it("uses accessible foreground text on Kawaii Fashion primary controls", () => {
    const { primary, primaryForeground } =
      KAWAII_FASHION_THEME.defaultTokens.palette;
    const lighter = Math.max(
      relativeLuminance(primary),
      relativeLuminance(primaryForeground),
    );
    const darker = Math.min(
      relativeLuminance(primary),
      relativeLuminance(primaryForeground),
    );

    expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    [
      LEGACY_CLASSIC_THEME,
      LEGACY_HOMEPAGE_MAPPING,
      LEGACY_ABOUT_MAPPING,
      THEME_HOMEPAGE_SECTION_TYPES,
    ],
    [
      VOLT_GEAR_THEME,
      V2_HOMEPAGE_MAPPING,
      V2_ABOUT_MAPPING,
      VOLT_GEAR_HOMEPAGE_SECTION_TYPES,
    ],
    [
      KAWAII_FASHION_THEME,
      KAWAII_FASHION_HOMEPAGE_RENDERER_PATHS,
      KAWAII_FASHION_ABOUT_RENDERER_PATHS,
      KAWAII_FASHION_HOMEPAGE_SECTION_TYPES,
    ],
  ])(
    "maps every homepage and About source type for $id",
    (theme, homepage, about, homepageSectionTypes) => {
      expect(HOMEPAGE_SECTION_TYPES).toHaveLength(17);
      expect(Object.keys(theme.renderers.homepageSections).sort()).toEqual(
        Object.keys(homepage).sort(),
      );
      expect(theme.renderers.homepageSections).toEqual(homepage);
      expect(ABOUT_SECTION_TYPES).toHaveLength(12);
      expect(Object.keys(theme.renderers.aboutSections).sort()).toEqual(
        [...ABOUT_SECTION_TYPES].sort(),
      );
      expect(theme.renderers.aboutSections).toEqual(about);
      expect(theme.slots.homepage.sectionTypes).toEqual(homepageSectionTypes);
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

  it("resolves the legacy v2-design id to Volt Gear", () => {
    expect(getStorefrontThemeManifest("v2-design")).toBe(VOLT_GEAR_THEME);
    expect(getStorefrontThemeManifest("v2-design", 1)).toBe(VOLT_GEAR_THEME);
    expect(getStorefrontThemeManifest("volt-gear")).toBe(VOLT_GEAR_THEME);
    expect(STOREFRONT_THEME_REGISTRY["v2-design"]).toBe(VOLT_GEAR_THEME);
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

  it.each(["legacy-classic", "volt-gear", "kawaii-fashion"])(
    "accepts installed %s version 1 configuration",
    (themeId) => {
      const result = normalizeStorefrontThemeConfigWithResult({
        ...validConfig,
        themeId,
      });

      expect(result.usedFallback).toBe(false);
      expect(result.errors).toEqual([]);
      expect(result.config.themeId).toBe(themeId);
      expect(result.config.themeVersion).toBe(1);
    },
  );

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

  it.each([LEGACY_CLASSIC_THEME, VOLT_GEAR_THEME, KAWAII_FASHION_THEME])(
    "always resolves non-primary tokens from $id defaults",
    (theme) => {
      const config = {
        ...createDefaultStorefrontThemeConfig(theme),
        tokenOverrides: {
          palette: {
            primary: "#123456",
            background: "#ffffff",
            border: "#ffffff",
          },
        },
      } as Parameters<typeof resolveStorefrontThemeTokens>[0];
      const tokens = resolveStorefrontThemeTokens(config);

      expect(tokens.palette.primary).toBe("#123456");
      expect(tokens.palette).toEqual({
        ...theme.defaultTokens.palette,
        primary: "#123456",
        primaryForeground: accessiblePrimaryForeground("#123456"),
      });
      expect(tokens.shape).toEqual(theme.defaultTokens.shape);
    },
  );
});
