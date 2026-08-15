import type { ComponentProps, ComponentType } from "react";
import Footer from "./Footer";
import Header from "./Header/Header";

type HeaderProps = ComponentProps<typeof Header>;
type FooterProps = ComponentProps<typeof Footer>;

const HEADER_RENDERERS: Readonly<Record<string, ComponentType<HeaderProps>>> = {
  "legacy-classic.navbar": Header,
};

const FOOTER_RENDERERS: Readonly<Record<string, ComponentType<FooterProps>>> = {
  "legacy-classic.footer": Footer,
};

export function ThemeHeader({
  rendererId,
  ...props
}: HeaderProps & { rendererId: string }) {
  const Renderer = HEADER_RENDERERS[rendererId] ?? Header;
  return <Renderer {...props} />;
}

export function ThemeFooter({
  rendererId,
  ...props
}: FooterProps & { rendererId: string }) {
  const Renderer = FOOTER_RENDERERS[rendererId] ?? Footer;
  return <Renderer {...props} />;
}
