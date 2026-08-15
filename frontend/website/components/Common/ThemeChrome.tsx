import type { ComponentProps } from "react";
import type { FooterVariant, NavbarVariant } from "@/lib/cms/siteChrome";
import Footer from "./Footer";
import Header from "./Header/Header";

type HeaderProps = ComponentProps<typeof Header>;
type FooterProps = ComponentProps<typeof Footer>;

const HEADER_RENDERERS: Readonly<Record<string, NavbarVariant>> = {
  "legacy-classic.navbar": "classic",
  "v2-design.navbar": "centered",
};

const FOOTER_RENDERERS: Readonly<Record<string, FooterVariant>> = {
  "legacy-classic.footer": "classic",
  "v2-design.footer": "compact",
};

export function ThemeHeader({
  rendererId,
  settings,
  ...props
}: HeaderProps & { rendererId: string }) {
  const variant = HEADER_RENDERERS[rendererId] ?? "classic";
  return (
    <Header
      {...props}
      settings={{
        ...settings,
        navbar: { ...settings.navbar, variant },
      }}
    />
  );
}

export function ThemeFooter({
  rendererId,
  settings,
  ...props
}: FooterProps & { rendererId: string }) {
  const variant = FOOTER_RENDERERS[rendererId] ?? "classic";
  return (
    <Footer
      {...props}
      settings={{
        ...settings,
        footer: { ...settings.footer, variant },
      }}
    />
  );
}
