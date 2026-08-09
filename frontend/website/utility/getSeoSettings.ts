import { bannerImageUrl, brandingImageUrl } from "@/utility/imageUrl";
import { readCmsBlob } from "@/lib/cms/jsonStore";
import {
  DEFAULT_PAGES_SEO,
  DEFAULT_SEO,
  SEO_PAGE_META,
  type CmsSeo,
  type SeoPageKey,
} from "@/lib/cms/types";
import type { SeoItemType } from "@/type/seoType";
import { SeoContent } from "@/SeoContent/SeoContent";
import { appConfig } from "@/lib/config";

function resolveSeoImage(path: string | null | undefined, fallback: string) {
  return brandingImageUrl(path) || bannerImageUrl(path) || fallback;
}

function keywordsFromCms(
  keywords: string | undefined,
  fallback?: string[],
): string[] | undefined {
  if (keywords?.trim()) {
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
  return fallback;
}

function toSeoItem(
  seo: CmsSeo,
  path: string,
  fallback: SeoItemType,
): SeoItemType {
  const baseUrl = (appConfig.siteUrl || fallback.siteUrl || "").replace(
    /\/$/,
    "",
  );
  const siteUrl = path === "/" ? baseUrl || "/" : `${baseUrl}${path}`;

  return {
    title: seo.title?.trim() || fallback.title,
    description: seo.description?.trim() || fallback.description,
    image: resolveSeoImage(seo.og_image_path, fallback.image),
    siteUrl,
    keywords: keywordsFromCms(seo.keywords, fallback.keywords),
  };
}

const STATIC_FALLBACK: Record<SeoPageKey, SeoItemType> = {
  home: SeoContent.baseSeo,
  about: SeoContent.aboutUsSeo,
  product: SeoContent.productSeo,
  contact: SeoContent.contactUsSeo,
  reviews: SeoContent.reviewsSeo,
  cart: SeoContent.cartSeo,
  wishlist: SeoContent.wishlistSeo,
  checkout: SeoContent.checkoutSeo,
  track: SeoContent.trackOrderSeo,
  privacy: SeoContent.privacyPolicySeo,
  terms: SeoContent.termsOfServiceSeo,
  refund: SeoContent.refundPolicySeo,
};

export async function getSeoConfig(): Promise<CmsSeo> {
  try {
    const cms = await readCmsBlob();
    return { ...DEFAULT_SEO, ...cms.pages_seo.home, ...cms.seo };
  } catch {
    return { ...DEFAULT_SEO };
  }
}

/** Site-wide SEO used by the root layout / homepage, with static fallbacks. */
export async function getBaseSeoItem(): Promise<SeoItemType> {
  return getSeoItem("home");
}

/** Per-page SEO from Admin → Settings → SEO. */
export async function getSeoItem(page: SeoPageKey): Promise<SeoItemType> {
  const fallback = STATIC_FALLBACK[page];
  const path = SEO_PAGE_META[page].path;

  try {
    const cms = await readCmsBlob();
    const fromPages = cms.pages_seo?.[page];
    const homeImage =
      cms.pages_seo?.home?.og_image_path || cms.seo?.og_image_path || null;
    const seo: CmsSeo =
      page === "home"
        ? {
            ...DEFAULT_PAGES_SEO.home,
            ...cms.seo,
            ...fromPages,
          }
        : {
            ...DEFAULT_PAGES_SEO[page],
            ...fromPages,
            og_image_path: fromPages?.og_image_path || homeImage,
          };

    return toSeoItem(seo, path, fallback);
  } catch {
    return toSeoItem(DEFAULT_PAGES_SEO[page], path, fallback);
  }
}
