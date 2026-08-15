import type { HomepageSectionType } from "../../type/db";
import type { AboutSectionType } from "../cms/aboutSections";
import {
  KAWAII_FASHION_ABOUT_RENDERER_PATHS,
  LEGACY_CLASSIC_ABOUT_RENDERER_PATHS,
  V2_DESIGN_ABOUT_RENDERER_PATHS,
} from "../cms/aboutRendererRegistry";
import {
  KAWAII_FASHION_HOMEPAGE_RENDERER_PATHS,
  LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS,
  V2_DESIGN_HOMEPAGE_RENDERER_PATHS,
  type HomepageRendererIdMapping,
} from "../cms/homepageRendererRegistry";
import {
  DEFAULT_PALETTE,
  KAWAII_WHITE_PALETTE,
  normalizePalette,
  normalizePaletteOverrides,
  type ThemePalette,
  type ThemePaletteOverrides,
} from "./palette";

export const STOREFRONT_THEME_SCHEMA_VERSION = 1 as const;

export const STOREFRONT_CONTENT_REFERENCES = {
  navbar: {
    relation: "site_settings",
    selector: { id: 1 },
    path: ["socials", "_cms", "navbar"],
  },
  footer: {
    relation: "site_settings",
    selector: { id: 1 },
    path: ["socials", "_cms", "footer"],
  },
  homepage: {
    relation: "homepage_sections",
    orderBy: ["sort", "created_at"],
  },
  about: {
    relation: "site_settings",
    selector: { id: 1 },
    path: ["socials", "_cms", "about_sections"],
  },
} as const;

export interface ThemeSemanticTokens {
  palette: ThemePalette;
}

export interface ThemeTokenOverrides {
  palette?: ThemePaletteOverrides;
}

export interface ThemeSlotCompatibility {
  rendererId: string;
  required: boolean;
  accepts: readonly string[];
}

export interface StorefrontThemeManifest {
  id: string;
  schemaVersion: typeof STOREFRONT_THEME_SCHEMA_VERSION;
  version: number;
  displayName: string;
  category: string;
  description: string;
  defaultTokens: ThemeSemanticTokens;
  renderers: {
    navbar: string;
    footer: string;
    homepageSections: HomepageRendererIdMapping;
    aboutSections: Record<AboutSectionType, string>;
  };
  compatibility: {
    storefrontApiVersion: number;
    homepageSectionVersions: readonly number[];
    aboutSectionVersions: readonly number[];
  };
  slots: {
    navbar: ThemeSlotCompatibility;
    footer: ThemeSlotCompatibility;
    homepage: ThemeSlotCompatibility & {
      sectionTypes: readonly HomepageSectionType[];
      allowsRepeatedSections: boolean;
    };
    about: ThemeSlotCompatibility & {
      sectionTypes: readonly AboutSectionType[];
      allowsRepeatedSections: boolean;
    };
  };
}

const LEGACY_HOMEPAGE_RENDERERS: HomepageRendererIdMapping = {
  ...LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS,
};

const LEGACY_ABOUT_RENDERERS: Record<AboutSectionType, string> = {
  ...LEGACY_CLASSIC_ABOUT_RENDERER_PATHS,
};

const V2_HOMEPAGE_RENDERERS: HomepageRendererIdMapping = {
  ...V2_DESIGN_HOMEPAGE_RENDERER_PATHS,
};

const V2_ABOUT_RENDERERS: Record<AboutSectionType, string> = {
  ...V2_DESIGN_ABOUT_RENDERER_PATHS,
};

const KAWAII_FASHION_HOMEPAGE_RENDERERS: HomepageRendererIdMapping = {
  ...KAWAII_FASHION_HOMEPAGE_RENDERER_PATHS,
};

const KAWAII_FASHION_ABOUT_RENDERERS: Record<AboutSectionType, string> = {
  ...KAWAII_FASHION_ABOUT_RENDERER_PATHS,
};

export const THEME_HOMEPAGE_SECTION_TYPES: readonly HomepageSectionType[] = [
  "banner",
  "featured",
  "categories",
  "richtext",
  "reviews",
  "promo",
];

export const KAWAII_FASHION_HOMEPAGE_SECTION_TYPES: readonly HomepageSectionType[] =
  [
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
  ];

export const THEME_ABOUT_SECTION_TYPES: readonly AboutSectionType[] = [
  "hero",
  "stats",
  "story",
  "values",
  "craft",
  "cta",
];

export const LEGACY_CLASSIC_THEME: StorefrontThemeManifest = {
  id: "legacy-classic",
  schemaVersion: STOREFRONT_THEME_SCHEMA_VERSION,
  version: 1,
  displayName: "Tee Drop Classic",
  category: "T-shirt dropshipping",
  description:
    "A conversion-focused T-shirt storefront for graphic drops, oversized fits, and streetwear collections.",
  defaultTokens: { palette: { ...DEFAULT_PALETTE } },
  renderers: {
    navbar: "legacy-classic.navbar",
    footer: "legacy-classic.footer",
    homepageSections: LEGACY_HOMEPAGE_RENDERERS,
    aboutSections: LEGACY_ABOUT_RENDERERS,
  },
  compatibility: {
    storefrontApiVersion: 1,
    homepageSectionVersions: [1, 2],
    aboutSectionVersions: [1, 2],
  },
  slots: {
    navbar: {
      rendererId: "legacy-classic.navbar",
      required: true,
      accepts: ["classic", "centered"],
    },
    footer: {
      rendererId: "legacy-classic.footer",
      required: true,
      accepts: ["classic", "compact"],
    },
    homepage: {
      rendererId: "legacy-classic.homepage",
      required: true,
      accepts: ["homepage-section-v1", "homepage-section-v2"],
      sectionTypes: THEME_HOMEPAGE_SECTION_TYPES,
      allowsRepeatedSections: false,
    },
    about: {
      rendererId: "legacy-classic.about",
      required: true,
      accepts: ["about-section-v1", "about-section-v2"],
      sectionTypes: THEME_ABOUT_SECTION_TYPES,
      allowsRepeatedSections: false,
    },
  },
};

export const V2_DESIGN_THEME: StorefrontThemeManifest = {
  id: "v2-design",
  schemaVersion: STOREFRONT_THEME_SCHEMA_VERSION,
  version: 1,
  displayName: "V2 Design",
  category: "V2 storefront",
  description:
    "The V2 Reverb storefront package with complete homepage and About coverage.",
  defaultTokens: { palette: { ...DEFAULT_PALETTE } },
  renderers: {
    navbar: "v2-design.navbar",
    footer: "v2-design.footer",
    homepageSections: V2_HOMEPAGE_RENDERERS,
    aboutSections: V2_ABOUT_RENDERERS,
  },
  compatibility: {
    storefrontApiVersion: 1,
    homepageSectionVersions: [1, 2],
    aboutSectionVersions: [1, 2],
  },
  slots: {
    navbar: {
      rendererId: "v2-design.navbar",
      required: true,
      accepts: ["classic", "centered"],
    },
    footer: {
      rendererId: "v2-design.footer",
      required: true,
      accepts: ["classic", "compact"],
    },
    homepage: {
      rendererId: "v2-design.homepage",
      required: true,
      accepts: ["homepage-section-v1", "homepage-section-v2"],
      sectionTypes: THEME_HOMEPAGE_SECTION_TYPES,
      allowsRepeatedSections: false,
    },
    about: {
      rendererId: "v2-design.about",
      required: true,
      accepts: ["about-section-v1", "about-section-v2"],
      sectionTypes: THEME_ABOUT_SECTION_TYPES,
      allowsRepeatedSections: false,
    },
  },
};

export const KAWAII_FASHION_THEME: StorefrontThemeManifest = {
  id: "kawaii-fashion",
  schemaVersion: STOREFRONT_THEME_SCHEMA_VERSION,
  version: 1,
  displayName: "Kawaii Fashion",
  category: "Light fashion and lifestyle ecommerce",
  description:
    "A bright, playful storefront for kawaii fashion, accessories, and lifestyle collections.",
  defaultTokens: {
    palette: {
      ...KAWAII_WHITE_PALETTE,
      primaryForeground: "#050505",
    },
  },
  renderers: {
    navbar: "kawaii-fashion.navbar",
    footer: "kawaii-fashion.footer",
    homepageSections: KAWAII_FASHION_HOMEPAGE_RENDERERS,
    aboutSections: KAWAII_FASHION_ABOUT_RENDERERS,
  },
  compatibility: {
    storefrontApiVersion: 1,
    homepageSectionVersions: [1, 2],
    aboutSectionVersions: [1, 2],
  },
  slots: {
    navbar: {
      rendererId: "kawaii-fashion.navbar",
      required: true,
      accepts: ["classic", "centered"],
    },
    footer: {
      rendererId: "kawaii-fashion.footer",
      required: true,
      accepts: ["classic", "compact"],
    },
    homepage: {
      rendererId: "kawaii-fashion.homepage",
      required: true,
      accepts: ["homepage-section-v1", "homepage-section-v2"],
      sectionTypes: KAWAII_FASHION_HOMEPAGE_SECTION_TYPES,
      allowsRepeatedSections: false,
    },
    about: {
      rendererId: "kawaii-fashion.about",
      required: true,
      accepts: ["about-section-v1", "about-section-v2"],
      sectionTypes: THEME_ABOUT_SECTION_TYPES,
      allowsRepeatedSections: false,
    },
  },
};

const INSTALLED_STOREFRONT_THEME_VERSIONS = [
  LEGACY_CLASSIC_THEME,
  V2_DESIGN_THEME,
  KAWAII_FASHION_THEME,
] as const;

export const AVAILABLE_STOREFRONT_THEMES = [
  LEGACY_CLASSIC_THEME,
  V2_DESIGN_THEME,
  KAWAII_FASHION_THEME,
] as const;

export const STOREFRONT_THEME_REGISTRY: Readonly<
  Record<string, StorefrontThemeManifest>
> = Object.fromEntries(
  AVAILABLE_STOREFRONT_THEMES.map((theme) => [theme.id, theme]),
);

export const STOREFRONT_THEME_VERSION_REGISTRY: Readonly<
  Record<string, StorefrontThemeManifest>
> = Object.fromEntries(
  INSTALLED_STOREFRONT_THEME_VERSIONS.map((theme) => [
    `${theme.id}@${theme.version}`,
    theme,
  ]),
);

function findStorefrontThemeManifest(
  themeId: unknown,
  themeVersion: unknown,
): StorefrontThemeManifest | undefined {
  if (typeof themeId !== "string" || !Number.isSafeInteger(themeVersion)) {
    return undefined;
  }
  return STOREFRONT_THEME_VERSION_REGISTRY[`${themeId}@${themeVersion}`];
}

export interface StorefrontThemeConfig {
  schemaVersion: typeof STOREFRONT_THEME_SCHEMA_VERSION;
  themeId: string;
  themeVersion: number;
  tokenOverrides: ThemeTokenOverrides;
}

export interface ThemeConfigNormalizationResult {
  config: StorefrontThemeConfig;
  errors: string[];
  usedFallback: boolean;
}

export function createDefaultStorefrontThemeConfig(
  manifest: StorefrontThemeManifest = LEGACY_CLASSIC_THEME,
): StorefrontThemeConfig {
  return {
    schemaVersion: STOREFRONT_THEME_SCHEMA_VERSION,
    themeId: manifest.id,
    themeVersion: manifest.version,
    tokenOverrides: {},
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeStorefrontThemeConfigWithResult(
  raw: unknown,
): ThemeConfigNormalizationResult {
  const fallback = createDefaultStorefrontThemeConfig();
  if (!isObject(raw)) {
    return {
      config: fallback,
      errors: ["Theme configuration must be an object."],
      usedFallback: true,
    };
  }

  if (raw.schemaVersion !== STOREFRONT_THEME_SCHEMA_VERSION) {
    return {
      config: fallback,
      errors: ["Theme configuration schema version is unsupported."],
      usedFallback: true,
    };
  }

  const currentManifest =
    typeof raw.themeId === "string"
      ? STOREFRONT_THEME_REGISTRY[raw.themeId]
      : undefined;
  if (!currentManifest) {
    return {
      config: fallback,
      errors: ["Theme is unknown or unavailable."],
      usedFallback: true,
    };
  }

  const manifest = findStorefrontThemeManifest(raw.themeId, raw.themeVersion);
  if (!manifest) {
    return {
      config: fallback,
      errors: ["Theme version is unsupported."],
      usedFallback: true,
    };
  }

  const errors: string[] = [];
  const configKeys = new Set([
    "schemaVersion",
    "themeId",
    "themeVersion",
    "tokenOverrides",
  ]);
  if (Object.keys(raw).some((key) => !configKeys.has(key))) {
    errors.push("Theme configuration contains unsupported fields.");
  }
  let palette: ThemePaletteOverrides | undefined;
  if (raw.tokenOverrides !== undefined) {
    if (!isObject(raw.tokenOverrides)) {
      errors.push("Theme token overrides must be an object.");
    } else if (
      Object.keys(raw.tokenOverrides).some((key) => key !== "palette")
    ) {
      errors.push("Theme token overrides contain unsupported fields.");
    }
    if (
      isObject(raw.tokenOverrides) &&
      raw.tokenOverrides.palette !== undefined
    ) {
      if (!isObject(raw.tokenOverrides.palette)) {
        errors.push("Theme palette overrides must be an object.");
      } else {
        palette = normalizePaletteOverrides(raw.tokenOverrides.palette);
        if (
          Object.keys(palette).length !==
          Object.keys(raw.tokenOverrides.palette).length
        ) {
          errors.push("One or more theme palette overrides are invalid.");
        }
      }
    }
  }

  return {
    config: {
      schemaVersion: STOREFRONT_THEME_SCHEMA_VERSION,
      themeId: manifest.id,
      themeVersion: manifest.version,
      tokenOverrides: palette && Object.keys(palette).length ? { palette } : {},
    },
    errors,
    usedFallback: false,
  };
}

export function normalizeStorefrontThemeConfig(
  raw: unknown,
): StorefrontThemeConfig {
  return normalizeStorefrontThemeConfigWithResult(raw).config;
}

export function getStorefrontThemeManifest(
  themeId: unknown,
  themeVersion?: unknown,
): StorefrontThemeManifest {
  if (themeVersion !== undefined) {
    return (
      findStorefrontThemeManifest(themeId, themeVersion) ?? LEGACY_CLASSIC_THEME
    );
  }
  return typeof themeId === "string" && STOREFRONT_THEME_REGISTRY[themeId]
    ? STOREFRONT_THEME_REGISTRY[themeId]
    : LEGACY_CLASSIC_THEME;
}

export function resolveStorefrontThemeTokens(
  config: StorefrontThemeConfig,
): ThemeSemanticTokens {
  const manifest = getStorefrontThemeManifest(
    config.themeId,
    config.themeVersion,
  );
  const overrides = normalizePaletteOverrides(config.tokenOverrides.palette);
  return {
    palette: normalizePalette({
      ...manifest.defaultTokens.palette,
      primary: overrides.primary ?? manifest.defaultTokens.palette.primary,
    }),
  };
}
