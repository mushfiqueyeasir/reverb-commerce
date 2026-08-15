import { KAWAII_FASHION_THEME } from "@/lib/theme/manifest";
import { getPalettePresets } from "@/lib/theme/palette";
import type { StorefrontThemePackage } from "@/components/themes/types";
import { KAWAII_FASHION_ABOUT_RENDERERS } from "./about/renderers";
import KawaiiFooter from "./chrome/KawaiiFooter";
import KawaiiHeader from "./chrome/KawaiiHeader";
import { KAWAII_FASHION_HOMEPAGE_RENDERERS } from "./homepage/renderers";

export const KAWAII_FASHION_THEME_PACKAGE: StorefrontThemePackage = {
  id: KAWAII_FASHION_THEME.id,
  manifest: KAWAII_FASHION_THEME,
  homepageRenderers: KAWAII_FASHION_HOMEPAGE_RENDERERS,
  aboutRenderers: KAWAII_FASHION_ABOUT_RENDERERS,
  chrome: {
    Header: KawaiiHeader,
    Footer: KawaiiFooter,
  },
  palettePresets: getPalettePresets(KAWAII_FASHION_THEME.id),
};