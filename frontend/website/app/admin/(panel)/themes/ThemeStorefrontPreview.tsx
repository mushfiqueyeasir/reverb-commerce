import type { CSSProperties } from "react";
import { ThemeFooter, ThemeHeader } from "@/components/Common/ThemeChrome";
import HomepageRenderer from "@/components/HomePage/HomepageRenderer";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { StoreBrandProvider } from "@/components/providers/StoreBrandProvider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_CHAT_WIDGETS } from "@/lib/chatWidgets";
import {
  KAWAII_FASHION_PREVIEW_DATA,
  KAWAII_FASHION_PREVIEW_SECTIONS,
} from "@/lib/cms/kawaiiFashionThemePreviewFixture";
import { DEFAULT_FOOTER, DEFAULT_NAVBAR } from "@/lib/cms/siteChrome";
import {
  TEE_DROP_PREVIEW_DATA,
  TEE_DROP_PREVIEW_SECTIONS,
} from "@/lib/cms/themePreviewFixture";
import { DEFAULT_CURRENCY_SETTINGS } from "@/lib/currency";
import { DEFAULT_DELIVERY_CHARGES } from "@/lib/delivery";
import {
  getStorefrontThemeManifest,
  resolveStorefrontThemeTokens,
  type StorefrontThemeConfig,
} from "@/lib/theme/manifest";
import { paletteToCssVars } from "@/lib/theme/palette";
import type { SiteSettings } from "@/utility/getSettings";

export function ThemeStorefrontPreview({
  config,
}: {
  config: StorefrontThemeConfig;
}) {
  const manifest = getStorefrontThemeManifest(
    config.themeId,
    config.themeVersion,
  );
  const palette = resolveStorefrontThemeTokens(config).palette;
  const isKawaiiFashion = config.themeId === "kawaii-fashion";
  const storeName = isKawaiiFashion ? "Kawaii" : "TeeDrop";
  const previewData = isKawaiiFashion
    ? KAWAII_FASHION_PREVIEW_DATA
    : TEE_DROP_PREVIEW_DATA;
  const previewSections = isKawaiiFashion
    ? KAWAII_FASHION_PREVIEW_SECTIONS
    : TEE_DROP_PREVIEW_SECTIONS;
  const settings: SiteSettings = {
    id: 1,
    store_name: storeName,
    logo_path: null,
    invoice_logo_path: null,
    favicon_path: null,
    logoUrl: null,
    invoiceLogoUrl: null,
    faviconUrl: null,
    contact_email: isKawaiiFashion
      ? "hello@kawaii.com.bd"
      : "hello@teedrop.store",
    contact_phone: isKawaiiFashion ? "+880 1700-111222" : "+880 1700-000000",
    address: "Dhaka, Bangladesh",
    currency: "BDT",
    currency_symbol: "৳",
    shipping_flat: 70,
    free_shipping_threshold: isKawaiiFashion ? 3000 : 2000,
    socials: {},
    google_analytics_id: null,
    meta_pixel_id: null,
    gtm_id: null,
    analytics_enabled: false,
    security_enabled: false,
    announcement_text: isKawaiiFashion
      ? "Free delivery across Bangladesh on orders over ৳3,000"
      : null,
    announcement_active: isKawaiiFashion,
    announcement_url: isKawaiiFashion ? "/product" : null,
    updated_at: new Date(0).toISOString(),
    currencies: { ...DEFAULT_CURRENCY_SETTINGS },
    deliveryCharges: { ...DEFAULT_DELIVERY_CHARGES },
    chatWidgets: { ...DEFAULT_CHAT_WIDGETS },
    palette,
    navbar: structuredClone(DEFAULT_NAVBAR),
    footer: {
      ...structuredClone(DEFAULT_FOOTER),
      description: isKawaiiFashion
        ? "Playful fashion, soft color, and charming everyday pieces selected to make getting dressed feel joyful."
        : "Premium graphic T-shirts, heavyweight cotton, and limited streetwear drops made for the road.",
    },
  };

  return (
    <div
      data-store-theme={manifest.id}
      data-store-theme-version={manifest.version}
      style={paletteToCssVars(palette) as CSSProperties}
      className="fixed inset-0 overflow-hidden bg-background text-foreground [&_a]:pointer-events-none [&_button]:pointer-events-none"
    >
      <StoreBrandProvider storeName={storeName}>
        <CurrencyProvider currencies={settings.currencies}>
          <ScrollArea className="h-dvh bg-background" variant="brand">
            <ThemeHeader
              rendererId={manifest.renderers.navbar}
              categories={previewData.categories}
              settings={settings}
              aiSearchEnabled={false}
            />
            <main className="min-h-[60vh]">
              <HomepageRenderer
                sections={previewSections}
                data={previewData}
                preview
                rendererMapping={manifest.renderers.homepageSections}
                resolveImageUrl={(path) => path}
              />
            </main>
            <ThemeFooter
              rendererId={manifest.renderers.footer}
              settings={settings}
              preview
            />
            <div
              className="h-[calc(5.75rem+env(safe-area-inset-bottom))] md:hidden"
              aria-hidden
            />
          </ScrollArea>
        </CurrencyProvider>
      </StoreBrandProvider>
    </div>
  );
}
