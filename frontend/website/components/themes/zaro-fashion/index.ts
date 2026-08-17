import { ZARO_FASHION_THEME } from "@/lib/theme/manifest";
import { getPalettePresets } from "@/lib/theme/palette";
import type { StorefrontThemePackage } from "@/components/themes/types";
import { ZARO_FASHION_ABOUT_RENDERERS } from "./about/renderers";
import ZaroFooter from "./chrome/ZaroFooter";
import ZaroHeader from "./chrome/ZaroHeader";
import { ZARO_FASHION_HOMEPAGE_RENDERERS } from "./homepage/renderers";

export const ZARO_FASHION_THEME_PACKAGE: StorefrontThemePackage = {
  id: ZARO_FASHION_THEME.id,
  manifest: ZARO_FASHION_THEME,
  homepageRenderers: ZARO_FASHION_HOMEPAGE_RENDERERS,
  aboutRenderers: ZARO_FASHION_ABOUT_RENDERERS,
  chrome: {
    Header: ZaroHeader,
    Footer: ZaroFooter,
  },
  palettePresets: getPalettePresets(ZARO_FASHION_THEME.id),
};
