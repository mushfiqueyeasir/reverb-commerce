import type { StorefrontThemePackage } from "./types";
import { KAWAII_FASHION_THEME_PACKAGE } from "./kawaii-fashion";
import { LEGACY_CLASSIC_THEME_PACKAGE } from "./legacy-classic";
import { V2_DESIGN_THEME_PACKAGE } from "./v2-design";

export const STOREFRONT_THEME_PACKAGES: readonly StorefrontThemePackage[] = [
  LEGACY_CLASSIC_THEME_PACKAGE,
  V2_DESIGN_THEME_PACKAGE,
  KAWAII_FASHION_THEME_PACKAGE,
];

export function getStorefrontThemePackage(
  themeId: string,
): StorefrontThemePackage {
  return (
    STOREFRONT_THEME_PACKAGES.find((theme) => theme.id === themeId) ??
    LEGACY_CLASSIC_THEME_PACKAGE
  );
}