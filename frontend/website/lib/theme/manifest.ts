import type { HomepageSectionType } from "../../type/db";
import type { AboutSectionType } from "../cms/aboutSections";
import type { HomepageSectionFamily } from "../cms/homepageSections";
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

export interface ThemeShapeTokens {
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    full: string;
  };
}

export interface ThemeSemanticTokens {
  palette: ThemePalette;
  shape: ThemeShapeTokens;
}

export interface ThemeTokenOverrides {
  palette?: ThemePaletteOverrides;
}

export type StorefrontProductCardVariant = "default" | "kawaii-fashion";

export interface ThemeSlotCompatibility {
  rendererId: string;
  required: boolean;
  accepts: readonly string[];
}

export interface StorefrontThemeSectionField {
  key: string;
  label: string;
  hint?: string;
  kind?: "text" | "textarea";
}

export interface StorefrontThemeSectionFieldGroup {
  family: HomepageSectionFamily;
  title: string;
  description: string;
  fields: readonly StorefrontThemeSectionField[];
}

export interface StorefrontThemeAdminConfig {
  browserAddress: string;
  homepageSectionLabels: Partial<Record<HomepageSectionType, string>>;
  featuredLimit: number | null;
  maxMosaicCategories: number;
  kawaiiLabels: boolean;
  sectionFieldGroups?: readonly StorefrontThemeSectionFieldGroup[];
}

export interface StorefrontThemePreviewConfig {
  fixture: "tee-drop" | "kawaii-fashion";
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  freeShippingThreshold: number;
  announcementText: string | null;
  announcementUrl: string | null;
  footerDescription: string;
}

export interface StorefrontThemeManifest {
  id: string;
  schemaVersion: typeof STOREFRONT_THEME_SCHEMA_VERSION;
  version: number;
  displayName: string;
  category: string;
  description: string;
  defaultTokens: ThemeSemanticTokens;
  productCardVariant: StorefrontProductCardVariant;
  admin: StorefrontThemeAdminConfig;
  preview: StorefrontThemePreviewConfig;
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
    "ai_search",
  ];

export const THEME_ABOUT_SECTION_TYPES: readonly AboutSectionType[] = [
  "hero",
  "stats",
  "story",
  "values",
  "craft",
  "cta",
];

export const LEGACY_CLASSIC_SHAPE: ThemeShapeTokens = {
  radius: {
    sm: "10px",
    md: "14px",
    lg: "20px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "40px",
    full: "9999px",
  },
};

export const V2_DESIGN_SHAPE: ThemeShapeTokens = {
  radius: {
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "28px",
    "2xl": "40px",
    "3xl": "48px",
    full: "9999px",
  },
};

export const KAWAII_FASHION_SHAPE: ThemeShapeTokens = {
  radius: {
    sm: "0px",
    md: "0px",
    lg: "0px",
    xl: "0px",
    "2xl": "0px",
    "3xl": "0px",
    full: "0px",
  },
};

export const KAWAII_SECTION_LABELS: Partial<
  Record<HomepageSectionType, string>
> = {
  banner: "Kawaii Hero",
  categories: "Beauty Categories",
  deals: "Today’s Best Deals",
  new_arrivals: "New Arrival Products",
  featured: "Featured Products",
  richtext: "Kawaii Brand Story",
  reviews: "Customer Reviews",
  promo: "Featured Promotion",
  guarantees: "Shopping Guarantees",
  studio_notes: "Studio Notes",
  ai_search: "AI Search Promo",
};

export const LEGACY_CLASSIC_THEME: StorefrontThemeManifest = {
  id: "legacy-classic",
  schemaVersion: STOREFRONT_THEME_SCHEMA_VERSION,
  version: 1,
  displayName: "Tee Drop Classic",
  category: "T-shirt dropshipping",
  description:
    "A conversion-focused T-shirt storefront for graphic drops, oversized fits, and streetwear collections.",
  defaultTokens: {
    palette: { ...DEFAULT_PALETTE },
    shape: LEGACY_CLASSIC_SHAPE,
  },
  productCardVariant: "default",
  admin: {
    browserAddress: "teedrop.store",
    homepageSectionLabels: {},
    featuredLimit: null,
    maxMosaicCategories: 4,
    kawaiiLabels: false,
  },
  preview: {
    fixture: "tee-drop",
    storeName: "TeeDrop",
    contactEmail: "hello@teedrop.store",
    contactPhone: "+880 1700-000000",
    freeShippingThreshold: 2000,
    announcementText: null,
    announcementUrl: null,
    footerDescription:
      "Premium graphic T-shirts, heavyweight cotton, and limited streetwear drops made for the road.",
  },
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
  defaultTokens: {
    palette: { ...DEFAULT_PALETTE },
    shape: V2_DESIGN_SHAPE,
  },
  productCardVariant: "default",
  admin: {
    browserAddress: "teedrop.store",
    homepageSectionLabels: {},
    featuredLimit: null,
    maxMosaicCategories: 4,
    kawaiiLabels: false,
  },
  preview: {
    fixture: "tee-drop",
    storeName: "TeeDrop",
    contactEmail: "hello@teedrop.store",
    contactPhone: "+880 1700-000000",
    freeShippingThreshold: 2000,
    announcementText: null,
    announcementUrl: null,
    footerDescription:
      "Premium graphic T-shirts, heavyweight cotton, and limited streetwear drops made for the road.",
  },
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
    shape: KAWAII_FASHION_SHAPE,
  },
  productCardVariant: "kawaii-fashion",
  admin: {
    browserAddress: "kawaii.com.bd",
    homepageSectionLabels: { ...KAWAII_SECTION_LABELS },
    featuredLimit: 10,
    maxMosaicCategories: 5,
    kawaiiLabels: true,
    sectionFieldGroups: [
      {
        family: "banner",
        title: "Kawaii Fashion labels",
        description: "Optional visible carousel copy.",
        fields: [
          { key: "edit_label", label: "Edit label" },
          { key: "image_badge", label: "Image badge" },
          { key: "footer_note", label: "Footer note" },
        ],
      },
      {
        family: "featured",
        title: "Kawaii Fashion product labels",
        description: "Leave any label blank to hide it.",
        fields: [
          { key: "product_list_label", label: "Product list label" },
          {
            key: "uncategorized_label_template",
            label: "Uncategorized label template",
            hint: "Use {number} for the generated item number.",
          },
        ],
      },
      {
        family: "reviews",
        title: "Kawaii Fashion review labels",
        description:
          "Fallback content is used only when a review field is empty.",
        fields: [
          { key: "customer_fallback", label: "Customer fallback" },
          { key: "verified_label", label: "Verified label" },
          {
            key: "item_label_template",
            label: "Item label template",
            hint: "Use {number} for the generated review number.",
          },
          {
            key: "rating_aria_template",
            label: "Rating accessibility template",
            hint: "Use {rating} and {maximum} for generated values.",
          },
          {
            key: "body_fallback",
            label: "Review body fallback",
            kind: "textarea",
          },
        ],
      },
      {
        family: "promo",
        title: "Kawaii Fashion promotion labels",
        description: "Leave any decorative label blank to hide it.",
        fields: [
          { key: "kicker", label: "Kicker" },
          { key: "limited_label", label: "Limited label" },
          { key: "discount_suffix", label: "Discount suffix" },
          { key: "cta_fallback_label", label: "Button fallback label" },
          { key: "image_eyebrow", label: "Image eyebrow" },
          { key: "image_title", label: "Image title" },
        ],
      },
    ],
  },
  preview: {
    fixture: "kawaii-fashion",
    storeName: "Kawaii",
    contactEmail: "hello@kawaii.com.bd",
    contactPhone: "+880 1700-111222",
    freeShippingThreshold: 3000,
    announcementText: "Free delivery across Bangladesh on orders over ৳3,000",
    announcementUrl: "/product",
    footerDescription:
      "Playful fashion, soft color, and charming everyday pieces selected to make getting dressed feel joyful.",
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
    shape: {
      radius: { ...manifest.defaultTokens.shape.radius },
    },
  };
}
