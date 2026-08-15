import type { Metadata } from "next";
import HomepageRenderer from "@/components/HomePage/HomepageRenderer";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { getStorefrontCategories } from "@/utility/getCategory";
import { getProducts, transformProduct } from "@/utility/getProducts";
import { getReviews, transformReview } from "@/utility/getReview";
import { getBanners } from "@/utility/getBanners";
import { getHomepageSections } from "@/utility/getHomepageSections";
import { getPromotions } from "@/utility/getPromotion";
import { getAiSearchSettings } from "@/lib/aiSearchSettings";
import { brandingImageUrl } from "@/utility/imageUrl";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getBaseSeoItem } from "@/utility/getSeoSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getBaseSeoItem();
  return generateSeoMetadata(seo);
}

export default async function HomePage() {
  const [
    banners,
    bannersV2,
    sections,
    categories,
    products,
    reviews,
    promotions,
    aiSearch,
    publishedTheme,
  ] = await Promise.all([
    getBanners("banner"),
    getBanners("banner_v2"),
    getHomepageSections(),
    getStorefrontCategories(),
    getProducts(),
    getReviews(),
    getPromotions(),
    getAiSearchSettings(),
    readCurrentPublishedStorefrontTheme(),
  ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const themeSections = sections.filter((section) =>
    manifest.slots.homepage.sectionTypes.includes(section.type),
  );

  return (
    <HomepageRenderer
      sections={themeSections}
      data={{
        banners,
        bannersV2,
        categories,
        products: products.map(transformProduct),
        reviews: reviews.map(transformReview),
        promotions,
        aiSearchEnabled: aiSearch.enabled,
      }}
      rendererMapping={manifest.renderers.homepageSections}
      resolveImageUrl={brandingImageUrl}
    />
  );
}
