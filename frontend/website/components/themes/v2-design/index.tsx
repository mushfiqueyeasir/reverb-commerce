import Footer from "@/components/Common/Footer";
import Header from "@/components/Common/Header/Header";
import { V2_DESIGN_THEME } from "@/lib/theme/manifest";
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
        navbar: { ...props.settings.navbar, variant: "centered" },
      }}
    />
  ),
  Footer: (props: ThemeChromeFooterProps) => (
    <Footer
      {...props}
      settings={{
        ...props.settings,
        footer: { ...props.settings.footer, variant: "compact" },
      }}
    />
  ),
};

export const V2_DESIGN_THEME_PACKAGE: StorefrontThemePackage = {
  id: V2_DESIGN_THEME.id,
  manifest: V2_DESIGN_THEME,
  homepageRenderers: {},
  aboutRenderers: {},
  chrome,
  palettePresets: getPalettePresets(V2_DESIGN_THEME.id),
};