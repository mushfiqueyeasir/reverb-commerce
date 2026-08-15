import { ThemeFooter, ThemeHeader } from "@/components/Common/ThemeChrome";
import StoreScrollShell from "@/components/Common/StoreScrollShell";
import PromotionModalWrapper from "@/components/Common/PromotionModalWrapper";
import ChatPlugins from "@/components/Common/ChatPlugins";
import CursorGlow from "@/components/HomePage/CursorGlow";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { ProductCardCopyProvider } from "@/components/providers/ProductCardCopyProvider";
import { CustomSecurity } from "@/utility/security/scripts";
import { Analytics } from "@/utility/analytics/analyticsScript";
import { getPromotions } from "@/utility/getPromotion";
import { getStorefrontCategories } from "@/utility/getCategory";
import { getSiteSettings } from "@/utility/getSettings";
import { getAiSearchSettings } from "@/lib/aiSearchSettings";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { appConfig } from "@/lib/config";

// Catalog + CMS change constantly — never statically cache storefront pages.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [promotions, categories, settings, aiSearch, publishedTheme] =
    await Promise.all([
      getPromotions(),
      getStorefrontCategories(),
      getSiteSettings(),
      getAiSearchSettings(),
      readCurrentPublishedStorefrontTheme(),
    ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );

  return (
    <CurrencyProvider currencies={settings.currencies}>
      <ProductCardCopyProvider copy={settings.navbar.productCardCopy}>
        <div
          data-store-theme={manifest.id}
          data-store-theme-version={manifest.version}
          className="relative bg-background text-foreground"
        >
          {settings.analytics_enabled && (
            <Analytics
              googleAnalyticsId={settings.google_analytics_id}
              metaPixelId={settings.meta_pixel_id}
              gtmId={settings.gtm_id}
            />
          )}
          {appConfig.securityEnabled && <CustomSecurity />}

          <CursorGlow />
          <StoreScrollShell>
            <div className="relative">
              <ThemeHeader
                rendererId={manifest.renderers.navbar}
                categories={categories}
                settings={settings}
                aiSearchEnabled={aiSearch.enabled}
              />
              <div className="min-h-[60vh]">{children}</div>
              <ThemeFooter
                rendererId={manifest.renderers.footer}
                settings={settings}
              />
              {/* Clearance for the mobile shopping tab bar */}
              <div
                className="h-[calc(5.75rem+env(safe-area-inset-bottom))] md:hidden"
                aria-hidden
              />
            </div>
          </StoreScrollShell>
          <PromotionModalWrapper promotions={promotions} />
          <ChatPlugins widgets={settings.chatWidgets} />
        </div>
      </ProductCardCopyProvider>
    </CurrencyProvider>
  );
}
