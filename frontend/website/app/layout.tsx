import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/Common/AppToaster";
import ThemeStyle from "@/components/Common/ThemeStyle";
import { isLightPalette } from "@/lib/theme/palette";
import { resolveStorefrontThemeTokens } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getBaseSeoItem } from "@/utility/getSeoSettings";
import { getSiteSettings } from "@/utility/getSettings";
import { StoreBrandProvider } from "@/components/providers/StoreBrandProvider";
import SubscriptionGate from "@/components/Common/SubscriptionGate";

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
  const tokens = resolveStorefrontThemeTokens(publishedTheme.config);
  const light = isLightPalette(tokens.palette);

  return (
    <html
      lang="en"
      data-theme={light ? "light" : "dark"}
      data-storefront-theme={publishedTheme.config.themeId || "legacy-classic"}
    >
      <body
        className={`${inter.variable} ${space.variable} ${jetbrains.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeStyle tokens={tokens} />
        <StoreBrandProvider storeName={settings.store_name || "Store"}>
          <SubscriptionGate storeName={settings.store_name || "Store"}>
            {children}
          </SubscriptionGate>
        </StoreBrandProvider>
        <AppToaster theme={light ? "light" : "dark"} />
      </body>
    </html>
  );
}
