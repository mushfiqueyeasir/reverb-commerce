import ZaroBanner from "./Banner";
import ZaroTrending from "./Trending";
import ZaroFeaturedCollections from "./Categories";
import ZaroBestSellers from "./BestSellers";
import ZaroPromo from "./Promo";
import ZaroStory from "./Story";
import ZaroInsider from "./Insider";
import { ZaroGuarantees } from "./Guarantees";
import { parseKawaiiGuaranteesConfig } from "@/lib/cms/homepageSections";
import { sanitizeCmsHtml } from "@/lib/html/sanitize";
import { selectHomepageProducts } from "@/lib/products/homepageFeatured";
import {
  configString,
  configLimit,
  optionalConfigLimit,
  selectHomepageBannerData,
  selectHomepageCategoryIds,
  type HomepageSectionRenderer,
  type HomepageSectionRendererProps,
  type HomepageSectionRendererRegistry,
} from "@/components/HomePage/HomepageRenderer";

function resolveZaroImage(
  resolveImageUrl: HomepageSectionRendererProps["resolveImageUrl"],
  path: string | null,
) {
  if (!path) return null;
  if (path.startsWith("/") || /^https?:\/\//i.test(path)) return path;
  return resolveImageUrl?.(path) ?? path;
}

function ZaroBannerRenderer({
  section,
  data,
  primaryBannerId,
}: HomepageSectionRendererProps) {
  const banners = selectHomepageBannerData(section.type, data);
  if (banners.length === 0) return null;
  return (
    <ZaroBanner
      banners={banners}
      description={configString(section.config, "description")}
      headingLevel={section.id === primaryBannerId ? "h1" : "h2"}
      seenInLabel={configString(section.config, "seen_in_label")}
    />
  );
}

function ZaroTrendingRenderer({ section, data }: HomepageSectionRendererProps) {
  const config = section.config;
  const products = selectHomepageProducts(
    data.products,
    configLimit(config, 4, 10),
    10,
  );
  if (products.length === 0) return null;
  return (
    <ZaroTrending
      products={products}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label")}
      ctaHref={configString(config, "cta_url") ?? "/product"}
    />
  );
}

function ZaroFeaturedCollectionsRenderer({
  section,
  data,
  preview,
  useLiveBindingsInPreview,
}: HomepageSectionRendererProps) {
  if (data.categories.length === 0) return null;
  const config = section.config;
  return (
    <ZaroFeaturedCollections
      categories={data.categories}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label")}
      ctaHref={configString(config, "cta_url") ?? "/product"}
      categoryIds={selectHomepageCategoryIds(
        config,
        preview,
        useLiveBindingsInPreview,
      )}
      limit={optionalConfigLimit(config)}
    />
  );
}

function ZaroBestSellersRenderer({
  section,
  data,
}: HomepageSectionRendererProps) {
  const config = section.config;
  const products = selectHomepageProducts(
    data.products,
    configLimit(config, 8, 12),
    12,
  );
  if (products.length === 0) return null;
  return (
    <ZaroBestSellers
      products={products}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label")}
      ctaHref={configString(config, "cta_url") ?? "/product"}
      tabLabels={{
        all: configString(config, "tab_all_label") ?? undefined,
        men: configString(config, "tab_men_label") ?? undefined,
        women: configString(config, "tab_women_label") ?? undefined,
        new: configString(config, "tab_new_label") ?? undefined,
      }}
    />
  );
}

function ZaroPromoRenderer({
  section,
  data,
  resolveImageUrl,
}: HomepageSectionRendererProps) {
  const config = section.config;
  const promotionId = configString(config, "promotion_id");
  const promotion =
    data.promotions.find((candidate) => candidate._id === promotionId) ??
    data.promotions[0] ??
    null;
  if (!promotion) return null;
  const sectionImagePath = configString(config, "image_path");
  return (
    <ZaroPromo
      promotion={promotion}
      title={section.title}
      subtitle={section.subtitle}
      ctaHref={
        configString(config, "cta_url") || promotion.ctaUrl || "/product"
      }
      ctaLabel={configString(config, "cta_label")}
      imageUrl={resolveZaroImage(resolveImageUrl, sectionImagePath)}
      imageAlt={configString(config, "image_alt")}
      countdownLabel={configString(config, "countdown_label")}
      shopSweaterLabel={configString(config, "shop_sweater_label")}
      shopWomenLabel={configString(config, "shop_women_label")}
      saleEyebrow={configString(config, "sale_eyebrow")}
      saveBigTitle={configString(config, "save_big_title")}
      saveBigBody={configString(config, "save_big_body")}
      saveBigCtaLabel={configString(config, "save_big_cta_label")}
      saveBigImageUrl={resolveZaroImage(
        resolveImageUrl,
        configString(config, "save_big_image_path"),
      )}
    />
  );
}

function ZaroStoryRenderer({
  section,
  resolveImageUrl,
}: HomepageSectionRendererProps) {
  const config = section.config;
  const imagePath = configString(config, "image_path");
  const imageUrl = resolveZaroImage(resolveImageUrl, imagePath);
  const rawImages = config.images;
  const images = Array.isArray(rawImages)
    ? rawImages
        .filter((item): item is string => typeof item === "string")
        .map((path) => resolveZaroImage(resolveImageUrl, path))
        .filter((path): path is string => Boolean(path))
    : null;
  return (
    <ZaroStory
      title={section.title}
      subtitle={section.subtitle}
      body={section.body ? sanitizeCmsHtml(section.body) : null}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label")}
      ctaHref={configString(config, "cta_url") ?? undefined}
      imageUrl={imageUrl}
      imageAlt={configString(config, "image_alt")}
      editorialEyebrow={configString(config, "editorial_eyebrow")}
      editorialTitle={configString(config, "editorial_title")}
      editorialBody={configString(config, "editorial_body")}
      editorialImages={images}
      realStyleTitle={configString(config, "real_style_title")}
      realStyleSubtitle={configString(config, "real_style_subtitle")}
    />
  );
}

function ZaroInsiderRenderer({ section, data }: HomepageSectionRendererProps) {
  const config = section.config;
  const reviews = data.reviews.slice(0, configLimit(config, 3, 3));
  if (reviews.length === 0) return null;
  return (
    <ZaroInsider
      reviews={reviews}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label")}
      ctaHref={configString(config, "cta_url") ?? "/reviews"}
      dateLabel={configString(config, "date_label")}
    />
  );
}

function ZaroGuaranteesRenderer({ section }: HomepageSectionRendererProps) {
  const config = parseKawaiiGuaranteesConfig(section.config);
  if (!config) return null;
  return (
    <ZaroGuarantees
      {...config}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(section.config, "eyebrow")}
    />
  );
}

export const ZARO_FASHION_HOMEPAGE_RENDERERS: Partial<HomepageSectionRendererRegistry> =
  {
    "zaro-fashion.banner": ZaroBannerRenderer,
    "zaro-fashion.categories": ZaroFeaturedCollectionsRenderer,
    "zaro-fashion.trending": ZaroTrendingRenderer,
    "zaro-fashion.best-sellers": ZaroBestSellersRenderer,
    "zaro-fashion.promo": ZaroPromoRenderer,
    "zaro-fashion.story": ZaroStoryRenderer,
    "zaro-fashion.insider": ZaroInsiderRenderer,
    "zaro-fashion.guarantees": ZaroGuaranteesRenderer,
  } satisfies Partial<Record<string, HomepageSectionRenderer>>;
