import type { CSSProperties } from "react";
import { ThemeFooter, ThemeHeader } from "@/components/Common/ThemeChrome";
import HomepageRenderer from "@/components/HomePage/HomepageRenderer";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import {
  getStorefrontThemeManifest,
  resolveStorefrontThemeTokens,
  type StorefrontThemeConfig,
} from "@/lib/theme/manifest";
import { paletteToCssVars } from "@/lib/theme/palette";
import { getBanners } from "@/utility/getBanners";
import { getCategories } from "@/utility/getCategory";
import { getHomepageSections } from "@/utility/getHomepageSections";
import { brandingImageUrl } from "@/utility/imageUrl";
import { getProducts, transformProduct } from "@/utility/getProducts";
import { getPromotions } from "@/utility/getPromotion";
import { getReviews, transformReview } from "@/utility/getReview";
import { getSiteSettings } from "@/utility/getSettings";

export async function ThemeStorefrontPreview({
  config,
}: {
  config: StorefrontThemeConfig;
}) {
  const [
    settings,
    banners,
    bannersV2,
    sections,
    categories,
    products,
    reviews,
    promotions,
  ] = await Promise.all([
    getSiteSettings(),
    getBanners("banner"),
    getBanners("banner_v2"),
    getHomepageSections(),
    getCategories(),
    getProducts(),
    getReviews(),
    getPromotions(),
  ]);
  const manifest = getStorefrontThemeManifest(
    config.themeId,
    config.themeVersion,
  );
  const palette = resolveStorefrontThemeTokens(config).palette;

  return (
    <div
      data-store-theme={manifest.id}
      style={paletteToCssVars(palette) as CSSProperties}
      className="max-h-[70dvh] overflow-y-auto rounded-2xl border border-border bg-background text-foreground [&_a]:pointer-events-none [&_button]:pointer-events-none"
    >
      <CurrencyProvider currencies={settings.currencies}>
        <ThemeHeader
          rendererId={manifest.renderers.navbar}
          categories={categories}
          settings={settings}
          aiSearchEnabled={false}
          preview
        />
        <HomepageRenderer
          sections={sections}
          data={{
            banners,
            bannersV2,
            categories,
            products: products.map(transformProduct),
            reviews: reviews.map(transformReview),
            promotions,
          }}
          preview
          useLiveBindingsInPreview
          rendererMapping={manifest.renderers.homepageSections}
          resolveImageUrl={brandingImageUrl}
        />
        <ThemeFooter
          rendererId={manifest.renderers.footer}
          settings={settings}
          preview
        />
      </CurrencyProvider>
    </div>
  );
}
