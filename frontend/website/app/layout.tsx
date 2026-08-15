import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/Common/AppToaster";
import ThemeStyle from "@/components/Common/ThemeStyle";
import { isLightPalette, normalizePalette } from "@/lib/theme/palette";
import { resolveStorefrontThemeTokens } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getBaseSeoItem } from "@/utility/getSeoSettings";
import { getSiteSettings } from "@/utility/getSettings";
import { StoreBrandProvider } from "@/components/providers/StoreBrandProvider";

// Settings / palette / SEO must always reflect the latest admin edits.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([
    getBaseSeoItem(),
    getSiteSettings(),
  ]);
  const metadata = await generateSeoMetadata(seo);

  if (settings.faviconUrl) {
    metadata.icons = {
      icon: [{ url: settings.faviconUrl }],
      shortcut: settings.faviconUrl,
      apple: [{ url: settings.faviconUrl }],
    };
  }

  return metadata;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, publishedTheme] = await Promise.all([
    getSiteSettings(),
    readCurrentPublishedStorefrontTheme(),
  ]);
  const palette = publishedTheme.isFallback
    ? normalizePalette(settings.palette)
    : resolveStorefrontThemeTokens(publishedTheme.config).palette;
  const light = isLightPalette(palette);

  return (
    <html lang="en" data-theme={light ? "light" : "dark"}>
      <body
        className={`${inter.variable} ${space.variable} ${jetbrains.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeStyle palette={palette} />
        <StoreBrandProvider storeName={settings.store_name || "Store"}>
          {children}
        </StoreBrandProvider>
        <AppToaster theme={light ? "light" : "dark"} />
      </body>
    </html>
  );
}
