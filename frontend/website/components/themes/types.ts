import type { ComponentType } from "react";
import type { HomepageSectionRendererRegistry } from "@/components/HomePage/HomepageRenderer";
import type { AboutRendererRegistry } from "@/lib/cms/aboutRendererRegistry";
import type { StorefrontThemeManifest } from "@/lib/theme/manifest";
import type { PalettePreset } from "@/lib/theme/palette";
import type { Category } from "@/type/categoryType";
import type { SiteSettings } from "@/utility/getSettings";

export interface ThemeChromeHeaderProps {
  categories: Category[];
  settings: SiteSettings;
  aiSearchEnabled: boolean;
  preview?: boolean;
}

export type ThemeChromeFooterSettings = Pick<
  SiteSettings,
  | "store_name"
  | "socials"
  | "footer"
  | "logoUrl"
  | "contact_email"
  | "contact_phone"
>;

export interface ThemeChromeFooterProps {
  settings: ThemeChromeFooterSettings;
  preview?: boolean;
}

export interface AboutSectionRendererProps {
  config: Record<string, unknown>;
  imageUrl?: string | null;
  preview?: boolean;
  headingLevel?: "h1" | "h2";
}

export type AboutSectionRenderer = ComponentType<AboutSectionRendererProps>;

export interface StorefrontThemePackage {
  id: string;
  manifest: StorefrontThemeManifest;
  homepageRenderers: Partial<HomepageSectionRendererRegistry>;
  aboutRenderers: Partial<AboutRendererRegistry<AboutSectionRenderer>>;
  chrome: {
    Header: ComponentType<ThemeChromeHeaderProps>;
    Footer: ComponentType<ThemeChromeFooterProps>;
  };
  palettePresets: PalettePreset[];
}