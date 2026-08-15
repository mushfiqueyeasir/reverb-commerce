import type { HomepageSectionType } from "../../type/db";
import { LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS } from "../cms/homepageRendererRegistry";
import {
  DEFAULT_PALETTE,
  normalizePalette,
  normalizePaletteOverrides,
  type ThemePalette,
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
} as const;

export interface ThemeSemanticTokens {
  palette: ThemePalette;
}

export interface ThemeTokenOverrides {
  palette?: Partial<ThemePalette>;
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
    homepageSections: Record<HomepageSectionType, string>;
  };
  compatibility: {
    storefrontApiVersion: number;
    homepageSectionVersions: readonly number[];
  };
  slots: {
    navbar: ThemeSlotCompatibility;
    footer: ThemeSlotCompatibility;
    homepage: ThemeSlotCompatibility & {
      sectionTypes: readonly HomepageSectionType[];
      allowsRepeatedSections: boolean;
    };
  };
}

const LEGACY_HOMEPAGE_RENDERERS: Record<HomepageSectionType, string> = {
  ...LEGACY_CLASSIC_HOMEPAGE_RENDERER_PATHS,
};

export const LEGACY_CLASSIC_THEME: StorefrontThemeManifest = {
  id: "legacy-classic",
  schemaVersion: STOREFRONT_THEME_SCHEMA_VERSION,
  version: 1,
  displayName: "Legacy Classic",
  category: "Classic storefront",
  description:
    "The current Reverb storefront with full compatibility for every homepage section.",
  defaultTokens: { palette: { ...DEFAULT_PALETTE } },
  renderers: {
    navbar: "legacy-classic.navbar",
    footer: "legacy-classic.footer",
    homepageSections: LEGACY_HOMEPAGE_RENDERERS,
  },
  compatibility: {
    storefrontApiVersion: 1,
    homepageSectionVersions: [1, 2],
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
      sectionTypes: Object.keys(
        LEGACY_HOMEPAGE_RENDERERS,
      ) as HomepageSectionType[],
      allowsRepeatedSections: false,
    },
  },
};

const INSTALLED_STOREFRONT_THEME_VERSIONS = [LEGACY_CLASSIC_THEME] as const;

export const AVAILABLE_STOREFRONT_THEMES = [LEGACY_CLASSIC_THEME] as const;

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
  let palette: Partial<ThemePalette> | undefined;
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
  return {
    palette: normalizePalette({
      ...manifest.defaultTokens.palette,
      ...config.tokenOverrides.palette,
    }),
  };
}
