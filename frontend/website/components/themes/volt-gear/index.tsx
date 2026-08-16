import { VOLT_GEAR_THEME } from "@/lib/theme/manifest";
import { getPalettePresets } from "@/lib/theme/palette";
import type { StorefrontThemePackage } from "@/components/themes/types";
import VoltFooter from "./chrome/VoltFooter";
import VoltHeader from "./chrome/VoltHeader";

export const VOLT_GEAR_THEME_PACKAGE: StorefrontThemePackage = {
  id: VOLT_GEAR_THEME.id,
  manifest: VOLT_GEAR_THEME,
  homepageRenderers: {},
  aboutRenderers: {},
  chrome: {
    Header: VoltHeader,
    Footer: VoltFooter,
  },
  palettePresets: getPalettePresets(VOLT_GEAR_THEME.id),
};