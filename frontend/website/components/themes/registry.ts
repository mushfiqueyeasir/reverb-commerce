import type { StorefrontThemePackage } from "./types";
import { KAWAII_FASHION_THEME_PACKAGE } from "./kawaii-fashion";
import { LEGACY_CLASSIC_THEME_PACKAGE } from "./legacy-classic";
import { VOLT_GEAR_THEME_PACKAGE } from "./volt-gear";
import { resolveStorefrontThemeId } from "@/lib/theme/manifest";

export const STOREFRONT_THEME_PACKAGES: readonly StorefrontThemePackage[] = [
  LEGACY_CLASSIC_THEME_PACKAGE,
  VOLT_GEAR_THEME_PACKAGE,
  KAWAII_FASHION_THEME_PACKAGE,
];

export function getStorefrontThemePackage(
  themeId: string,
): StorefrontThemePackage {
  const resolvedId = resolveStorefrontThemeId(themeId);
  return (
    STOREFRONT_THEME_PACKAGES.find((theme) => theme.id === resolvedId) ??
    LEGACY_CLASSIC_THEME_PACKAGE
  );
}
