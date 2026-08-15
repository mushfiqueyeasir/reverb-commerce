import { getStorefrontThemePackage } from "@/components/themes/registry";
import type {
  ThemeChromeFooterProps,
  ThemeChromeHeaderProps,
} from "@/components/themes/types";

export function ThemeHeader({
  rendererId,
  ...props
}: ThemeChromeHeaderProps & { rendererId: string }) {
  const themeId = rendererId.split(".")[0];
  const { chrome } = getStorefrontThemePackage(themeId);
  const Header = chrome.Header;
  return <Header {...props} />;
}

export function ThemeFooter({
  rendererId,
  ...props
}: ThemeChromeFooterProps & { rendererId: string }) {
  const themeId = rendererId.split(".")[0];
  const { chrome } = getStorefrontThemePackage(themeId);
  const Footer = chrome.Footer;
  return <Footer {...props} />;
}