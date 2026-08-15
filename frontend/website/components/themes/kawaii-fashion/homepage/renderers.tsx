import KawaiiFashionBanner from "./Banner";
import KawaiiFashionCategories from "./Categories";
import KawaiiFashionFeaturedProducts from "./FeaturedProducts";
import {
  KawaiiFashionGuarantees,
  KawaiiFashionStudioNotes,
} from "./HomepageSupport";
import KawaiiFashionAiSearch from "./AiSearch";
import KawaiiFashionPromo from "./Promo";
import KawaiiFashionReviews from "./Reviews";
import KawaiiFashionStory from "./Story";
import {
  getHomepageSectionMetadata,
  parseKawaiiAiSearchConfig,
  parseKawaiiGuaranteesConfig,
  parseKawaiiStudioNotesConfig,
} from "@/lib/cms/homepageSections";
import { sanitizeCmsHtml } from "@/lib/html/sanitize";
import { selectHomepageProducts } from "@/lib/products/homepageFeatured";
import {
  configString,
  configLimit,
  optionalConfigLimit,
  resolveSectionImage,
  selectHomepageBannerData,
  selectHomepageCategoryIds,
  type HomepageSectionRenderer,
  type HomepageSectionRendererProps,
  type HomepageSectionRendererRegistry,
} from "@/components/HomePage/HomepageRenderer";

const KAWAII_AI_SEARCH_FALLBACK_IMAGE = "/images/lovable/ai-search-hero.jpg";

function KawaiiFashionBannerRenderer({
  section,
  data,
  primaryBannerId,
}: HomepageSectionRendererProps) {
  const banners = selectHomepageBannerData(section.type, data);
  if (banners.length === 0) return null;
  return (
    <KawaiiFashionBanner
      banners={banners}
      description={configString(section.config, "description")}
      editLabel={configString(section.config, "edit_label")}
      footerNote={configString(section.config, "footer_note")}
      imageBadge={configString(section.config, "image_badge")}
      headingLevel={section.id === primaryBannerId ? "h1" : "h2"}
    />
  );
}

function KawaiiFashionCategoriesRenderer({
  section,
  data,
  preview,
  useLiveBindingsInPreview,
}: HomepageSectionRendererProps) {
  if (data.categories.length === 0) return null;
  const config = section.config;
  return (
    <KawaiiFashionCategories
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

function KawaiiFashionFeaturedRenderer({
  section,
  data,
}: HomepageSectionRendererProps) {
  const config = section.config;
  const products = selectHomepageProducts(
    data.products,
    configLimit(config, 10, 10),
    10,
    getHomepageSectionMetadata(section.type)?.productSelection,
  );
  if (products.length === 0) return null;
  return (
    <KawaiiFashionFeaturedProducts
      products={products}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label")}
      ctaHref={configString(config, "cta_url") ?? "/product"}
      listLabel={configString(config, "product_list_label")}
      uncategorizedLabelTemplate={configString(
        config,
        "uncategorized_label_template",
      )}
    />
  );
}

function KawaiiFashionReviewsRenderer({
  section,
  data,
}: HomepageSectionRendererProps) {
  const config = section.config;
  const reviews = data.reviews.slice(0, configLimit(config, 8, 12));
  if (reviews.length === 0) return null;
  return (
    <KawaiiFashionReviews
      reviews={reviews}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label")}
      ctaHref={configString(config, "cta_url") ?? "/reviews"}
      customerFallback={configString(config, "customer_fallback")}
      bodyFallback={configString(config, "body_fallback")}
      itemLabelTemplate={configString(config, "item_label_template")}
      verifiedLabel={configString(config, "verified_label")}
      ratingAriaTemplate={configString(config, "rating_aria_template")}
    />
  );
}

function KawaiiFashionPromoRenderer({
  section,
  data,
}: HomepageSectionRendererProps) {
  const config = section.config;
  const promotionId = configString(config, "promotion_id");
  const promotion =
    data.promotions.find((candidate) => candidate._id === promotionId) ??
    data.promotions[0] ??
    null;
  if (!promotion) return null;
  return (
    <KawaiiFashionPromo
      promotion={promotion}
      title={section.title}
      subtitle={section.subtitle}
      ctaHref={
        configString(config, "cta_url") || promotion.ctaUrl || "/product"
      }
      ctaLabel={configString(config, "cta_label")}
      kicker={configString(config, "kicker")}
      limitedLabel={configString(config, "limited_label")}
      discountSuffix={configString(config, "discount_suffix")}
      imageEyebrow={configString(config, "image_eyebrow")}
      imageTitle={configString(config, "image_title")}
      ctaFallbackLabel={configString(config, "cta_fallback_label")}
    />
  );
}

function KawaiiFashionStoryRenderer({
  section,
  resolveImageUrl,
}: HomepageSectionRendererProps) {
  const config = section.config;
  const imageUrl =
    resolveImageUrl?.(configString(config, "image_path")) ??
    (config.variant === "fabric" ? "/images/lovable/fabric-texture.jpg" : null);
  return (
    <KawaiiFashionStory
      title={section.title}
      subtitle={section.subtitle}
      body={section.body ? sanitizeCmsHtml(section.body) : null}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label")}
      ctaHref={configString(config, "cta_url")}
      config={config}
      imageUrl={imageUrl}
    />
  );
}

function KawaiiFashionGuaranteesRenderer({
  section,
}: HomepageSectionRendererProps) {
  const config = parseKawaiiGuaranteesConfig(section.config);
  return config ? <KawaiiFashionGuarantees {...config} /> : null;
}

function KawaiiFashionStudioNotesRenderer({
  section,
}: HomepageSectionRendererProps) {
  const config = parseKawaiiStudioNotesConfig(section.config);
  const title = section.title?.trim();
  const body = section.subtitle?.trim();
  if (!config || !title || !body) return null;
  return (
    <KawaiiFashionStudioNotes
      eyebrow={config.eyebrow}
      title={title}
      body={body}
      ctaLabel={config.ctaLabel}
      ctaHref={config.ctaUrl}
    />
  );
}

function KawaiiFashionAiSearchRenderer({
  section,
  resolveImageUrl,
  data,
}: HomepageSectionRendererProps) {
  const config = parseKawaiiAiSearchConfig(section.config);
  const title = section.title?.trim();
  const body = section.subtitle?.trim();
  if (!config || !title) return null;
  const imageUrl = resolveSectionImage(
    resolveImageUrl,
    config.imagePath,
    KAWAII_AI_SEARCH_FALLBACK_IMAGE,
  );
  return (
    <KawaiiFashionAiSearch
      eyebrow={config.eyebrow}
      title={title}
      body={body}
      ctaLabel={config.ctaLabel}
      pillLabel={config.pillLabel}
      imageUrl={imageUrl}
      imageAlt={config.imageAlt}
      aiSearchEnabled={data.aiSearchEnabled}
    />
  );
}

export const KAWAII_FASHION_HOMEPAGE_RENDERERS: Partial<HomepageSectionRendererRegistry> =
  {
    "kawaii-fashion.banner": KawaiiFashionBannerRenderer,
    "kawaii-fashion.categories": KawaiiFashionCategoriesRenderer,
    "kawaii-fashion.featured": KawaiiFashionFeaturedRenderer,
    "kawaii-fashion.reviews": KawaiiFashionReviewsRenderer,
    "kawaii-fashion.promo": KawaiiFashionPromoRenderer,
    "kawaii-fashion.story": KawaiiFashionStoryRenderer,
    "kawaii-fashion.guarantees": KawaiiFashionGuaranteesRenderer,
    "kawaii-fashion.studio-notes": KawaiiFashionStudioNotesRenderer,
    "kawaii-fashion.ai-search": KawaiiFashionAiSearchRenderer,
  } satisfies Partial<Record<string, HomepageSectionRenderer>>;