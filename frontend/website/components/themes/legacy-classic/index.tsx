import Footer from "@/components/Common/Footer";
import Header from "@/components/Common/Header/Header";
import { LEGACY_CLASSIC_THEME } from "@/lib/theme/manifest";
import { getPalettePresets } from "@/lib/theme/palette";
import type {
  StorefrontThemePackage,
  ThemeChromeFooterProps,
  ThemeChromeHeaderProps,
} from "@/components/themes/types";

const chrome: StorefrontThemePackage["chrome"] = {
  Header: (props: ThemeChromeHeaderProps) => (
    <Header
      {...props}
      settings={{
        ...props.settings,
        navbar: { ...props.settings.navbar, variant: "classic" },
      }}
    />
  ),
  Footer: (props: ThemeChromeFooterProps) => (
    <Footer
      {...props}
      settings={{
        ...props.settings,
        footer: { ...props.settings.footer, variant: "classic" },
      }}
    />
  ),
};

export const LEGACY_CLASSIC_THEME_PACKAGE: StorefrontThemePackage = {
  id: LEGACY_CLASSIC_THEME.id,
  manifest: LEGACY_CLASSIC_THEME,
  homepageRenderers: {},
  aboutRenderers: {},
  chrome,
  palettePresets: getPalettePresets(LEGACY_CLASSIC_THEME.id),
};