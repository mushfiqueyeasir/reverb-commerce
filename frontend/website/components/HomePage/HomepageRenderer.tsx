import type { ReactNode } from "react";
import BannerV2 from "@/components/HomePage/BannerV2";
import Category from "@/components/HomePage/Category";
import CategoryV2 from "@/components/HomePage/CategoryV2";
import FeaturedProducts from "@/components/HomePage/FeaturedProducts";
import FeaturedProductsV2 from "@/components/HomePage/FeaturedProductsV2";
import Hero from "@/components/HomePage/Hero";
import Marquee from "@/components/HomePage/Marquee";
import PromoStrip from "@/components/HomePage/PromoStrip";
import PromoV2 from "@/components/HomePage/PromoV2";
import ReviewSlider from "@/components/HomePage/ReviewSlider";
import ReviewsV2 from "@/components/HomePage/ReviewsV2";
import RichTextSection from "@/components/HomePage/RichTextSection";
import RichTextSectionV2 from "@/components/HomePage/RichTextSectionV2";
import KawaiiFashionBanner from "@/components/themes/kawaii-fashion/homepage/Banner";
import KawaiiFashionCategories from "@/components/themes/kawaii-fashion/homepage/Categories";
import KawaiiFashionFeaturedProducts from "@/components/themes/kawaii-fashion/homepage/FeaturedProducts";
import {
  KawaiiFashionGuarantees,
  KawaiiFashionStudioNotes,
} from "@/components/themes/kawaii-fashion/homepage/HomepageSupport";
import KawaiiFashionAiSearch from "@/components/themes/kawaii-fashion/homepage/AiSearch";
import KawaiiFashionPromo from "@/components/themes/kawaii-fashion/homepage/Promo";
import KawaiiFashionReviews from "@/components/themes/kawaii-fashion/homepage/Reviews";
import KawaiiFashionStory from "@/components/themes/kawaii-fashion/homepage/Story";
import {
  getHomepageSectionMetadata,
  parseKawaiiAiSearchConfig,
  parseKawaiiGuaranteesConfig,
  parseKawaiiStudioNotesConfig,
} from "@/lib/cms/homepageSections";
import {
  createHomepageRendererRegistry,
  resolveHomepageRenderer,
  type HomepageRendererIdMapping,
  type HomepageRendererRegistry,
} from "@/lib/cms/homepageRendererRegistry";
import { sanitizeCmsHtml } from "@/lib/html/sanitize";
import { selectHomepageProducts } from "@/lib/products/homepageFeatured";
import type { Category as CategoryType } from "@/type/categoryType";
import {
  DEFAULT_BANNER_DESCRIPTION,
  DEFAULT_BANNER_MARQUEE,
  DEFAULT_BANNER_STATS,
  type BannerStatItem,
  type HomepageSectionType,
} from "@/type/db";
import type { TransformedProduct } from "@/type/productType";
import type { Promotion } from "@/type/promotionType";
import type { TransformedReview } from "@/type/reviewType";
import type { Banner } from "@/utility/getBanners";

export interface HomepageRendererSection {
  id: string;
  type: HomepageSectionType;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  config: Record<string, unknown>;
}

export interface HomepageRendererData {
  banners: Banner[];
  bannersV2: Banner[];
  categories: CategoryType[];
  products: TransformedProduct[];
  reviews: TransformedReview[];
  promotions: Promotion[];
  aiSearchEnabled?: boolean;
}

export interface HomepageSectionRendererProps {
  section: HomepageRendererSection;
  data: HomepageRendererData;
  preview?: boolean;
  useLiveBindingsInPreview?: boolean;
  primaryBannerId?: string;
  resolveImageUrl?: (path: string | null) => string | null;
}

export type HomepageSectionRenderer = (
  props: HomepageSectionRendererProps,
) => ReactNode;

export type HomepageSectionRendererMapping = HomepageRendererIdMapping;

export type HomepageSectionRendererRegistry =
  HomepageRendererRegistry<HomepageSectionRenderer>;

export interface HomepageRendererProps {
  sections: readonly HomepageRendererSection[];
  data: HomepageRendererData;
  preview?: boolean;
  useLiveBindingsInPreview?: boolean;
  primaryBannerId?: string;
  rendererMapping?: HomepageSectionRendererMapping;
  renderers?: Partial<HomepageSectionRendererRegistry>;
  resolveImageUrl?: (path: string | null) => string | null;
}

function configString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function configLimit(
  config: Record<string, unknown>,
  fallback: number,
  maximum = 24,
): number {
  const value = config.limit;
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(1, Math.floor(value)));
}

function optionalConfigLimit(
  config: Record<string, unknown>,
): number | undefined {
  const value = config.limit;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(24, Math.max(1, Math.floor(value)));
}

function configStringArray(
  config: Record<string, unknown>,
  key: string,
): string[] | null {
  const value = config[key];
  if (!Array.isArray(value)) return null;
  return [
    ...new Set(
      value.filter((item): item is string => typeof item === "string"),
    ),
  ];
}

function resolveSectionImage(
  resolveImageUrl: HomepageRendererProps["resolveImageUrl"],
  path: string | null,
  fallback: string,
): string {
  const resolved = resolveImageUrl?.(path);
  if (resolved && (/^https?:\/\//i.test(resolved) || resolved.startsWith("/"))) {
    return resolved;
  }
  return fallback;
}

export function selectHomepageCategoryIds(
  config: Record<string, unknown>,
  preview = false,
  useLiveBindingsInPreview = false,
): string[] | null {
  return preview && !useLiveBindingsInPreview
    ? null
    : configStringArray(config, "category_ids");
}

function configBoolean(
  config: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = config[key];
  return typeof value === "boolean" ? value : fallback;
}

function configStats(config: Record<string, unknown>): BannerStatItem[] {
  const raw = config.stats;
  if (!Array.isArray(raw)) return DEFAULT_BANNER_STATS;
  const parsed = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const value = item as Record<string, unknown>;
      const label = typeof value.label === "string" ? value.label.trim() : "";
      const statValue =
        typeof value.value === "string" ? value.value.trim() : "";
      if (!label && !statValue) return null;
      return { label: label || "—", value: statValue || "—" };
    })
    .filter((item): item is BannerStatItem => Boolean(item));
  return parsed.length ? parsed : DEFAULT_BANNER_STATS;
}

function configMarquee(config: Record<string, unknown>): string[] {
  const raw = config.marquee_items;
  if (!Array.isArray(raw)) return DEFAULT_BANNER_MARQUEE;
  const parsed = raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_BANNER_MARQUEE;
}

export function selectHomepageBannerData(
  sectionType: HomepageSectionType,
  data: Pick<HomepageRendererData, "banners" | "bannersV2">,
): Banner[] {
  if (sectionType === "banner") return data.banners;
  if (sectionType === "banner_v2") return data.bannersV2;
  return [];
}

function BannerClassicRenderer({
  section,
  data,
}: HomepageSectionRendererProps) {
  const banners = selectHomepageBannerData(section.type, data);
  if (banners.length === 0) return null;
  const config = section.config;
  const description =
    configString(config, "description") ?? DEFAULT_BANNER_DESCRIPTION;

  return (
    <>
      <Hero
        banners={banners}
        description={description}
        stats={configStats(config)}
      />
      {configBoolean(config, "show_marquee", true) ? (
        <Marquee items={configMarquee(config)} />
      ) : null}
    </>
  );
}

function BannerV2Renderer({
  section,
  data,
  primaryBannerId,
}: HomepageSectionRendererProps) {
  const banners = selectHomepageBannerData(section.type, data);
  if (banners.length === 0) return null;
  return (
    <BannerV2
      banners={banners}
      description={
        configString(section.config, "description") ??
        DEFAULT_BANNER_DESCRIPTION
      }
      headingLevel={section.id === primaryBannerId ? "h1" : "h2"}
    />
  );
}

function CategoriesClassicRenderer({
  section,
  data,
  preview,
  useLiveBindingsInPreview,
}: HomepageSectionRendererProps) {
  if (data.categories.length === 0) return null;
  const config = section.config;
  return (
    <Category
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
    />
  );
}

function CategoriesV2Renderer({
  section,
  data,
  preview,
  useLiveBindingsInPreview,
}: HomepageSectionRendererProps) {
  if (data.categories.length === 0) return null;
  const config = section.config;
  return (
    <CategoryV2
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
      preview={preview}
    />
  );
}

function renderFeatured(
  props: HomepageSectionRendererProps,
  maximum: 5 | 6,
  version: 1 | 2,
) {
  const { section, data, preview } = props;
  const config = section.config;
  const products = selectHomepageProducts(
    data.products,
    configLimit(config, maximum, maximum),
    maximum,
    getHomepageSectionMetadata(section.type)?.productSelection,
  );
  if (products.length === 0) return null;
  const featuredProps = {
    products,
    title: section.title,
    subtitle: section.subtitle,
    eyebrow: configString(config, "eyebrow"),
    ctaLabel: configString(config, "cta_label") ?? "View all products",
    ctaHref: "/product",
  };
  return version === 2 ? (
    <FeaturedProductsV2 {...featuredProps} preview={preview} />
  ) : (
    <FeaturedProducts {...featuredProps} />
  );
}

function FeaturedClassicRenderer(props: HomepageSectionRendererProps) {
  return renderFeatured(props, 5, 1);
}

function FeaturedV2Renderer(props: HomepageSectionRendererProps) {
  return renderFeatured(props, 6, 2);
}

function renderReviews(props: HomepageSectionRendererProps, version: 1 | 2) {
  const { section, data } = props;
  const config = section.config;
  const reviews = data.reviews.slice(0, configLimit(config, 24));
  if (reviews.length === 0) return null;
  const reviewProps = {
    reviews,
    title: section.title,
    subtitle: section.subtitle,
    eyebrow: configString(config, "eyebrow"),
    ctaLabel: configString(config, "cta_label"),
    ctaHref: configString(config, "cta_url") ?? "/reviews",
  };
  return version === 2 ? (
    <ReviewsV2 {...reviewProps} />
  ) : (
    <ReviewSlider {...reviewProps} />
  );
}

function ReviewsClassicRenderer(props: HomepageSectionRendererProps) {
  return renderReviews(props, 1);
}

function ReviewsV2Renderer(props: HomepageSectionRendererProps) {
  return renderReviews(props, 2);
}

function renderPromotion(props: HomepageSectionRendererProps, version: 1 | 2) {
  const { section, data } = props;
  const config = section.config;
  const promotionId = configString(config, "promotion_id");
  const promotion =
    data.promotions.find((candidate) => candidate._id === promotionId) ??
    data.promotions[0] ??
    null;
  if (!promotion) return null;
  const promotionProps = {
    promotion,
    title: section.title,
    subtitle: section.subtitle,
    ctaHref: configString(config, "cta_url") || promotion.ctaUrl || "/product",
    ctaLabel:
      configString(config, "cta_label") ||
      promotion.ctaLabel ||
      (version === 2 ? "Shop offer" : "Shop the drop"),
  };
  return version === 2 ? (
    <PromoV2 {...promotionProps} />
  ) : (
    <PromoStrip {...promotionProps} />
  );
}

function PromotionClassicRenderer(props: HomepageSectionRendererProps) {
  return renderPromotion(props, 1);
}

function PromotionV2Renderer(props: HomepageSectionRendererProps) {
  return renderPromotion(props, 2);
}

function renderRichText(props: HomepageSectionRendererProps, version: 1 | 2) {
  const { section, preview, resolveImageUrl } = props;
  const config = section.config;
  const imageUrl =
    resolveImageUrl?.(configString(config, "image_path")) ??
    (config.variant === "fabric" ? "/images/lovable/fabric-texture.jpg" : null);
  const richTextProps = {
    title: section.title,
    subtitle: section.subtitle,
    body: section.body ? sanitizeCmsHtml(section.body) : null,
    eyebrow: configString(config, "eyebrow"),
    ctaLabel: configString(config, "cta_label"),
    ctaHref: configString(config, "cta_url"),
    config,
    imageUrl,
  };
  return version === 2 ? (
    <RichTextSectionV2 {...richTextProps} preview={preview} />
  ) : (
    <RichTextSection {...richTextProps} />
  );
}

function RichTextClassicRenderer(props: HomepageSectionRendererProps) {
  return renderRichText(props, 1);
}

function RichTextV2Renderer(props: HomepageSectionRendererProps) {
  return renderRichText(props, 2);
}

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

const KAWAII_AI_SEARCH_FALLBACK_IMAGE = "/images/lovable/ai-search-hero.jpg";

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

export const LEGACY_CLASSIC_HOMEPAGE_RENDERERS: HomepageSectionRendererRegistry =
  {
    "banner-classic": BannerClassicRenderer,
    "categories-classic": CategoriesClassicRenderer,
    "featured-classic": FeaturedClassicRenderer,
    "reviews-classic": ReviewsClassicRenderer,
    "promo-classic": PromotionClassicRenderer,
    "richtext-classic": RichTextClassicRenderer,
    "banner-v2": BannerV2Renderer,
    "categories-v2": CategoriesV2Renderer,
    "featured-v2": FeaturedV2Renderer,
    "reviews-v2": ReviewsV2Renderer,
    "promo-v2": PromotionV2Renderer,
    "richtext-v2": RichTextV2Renderer,
  } satisfies HomepageSectionRendererRegistry;

export const KAWAII_FASHION_HOMEPAGE_RENDERERS: HomepageSectionRendererRegistry =
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
  } satisfies HomepageSectionRendererRegistry;

export function getPrimaryHomepageBannerId(
  sections: readonly HomepageRendererSection[],
  data: Pick<HomepageRendererData, "banners" | "bannersV2">,
): string | undefined {
  return sections.find(
    (section) => selectHomepageBannerData(section.type, data).length > 0,
  )?.id;
}

export function renderHomepageSection(
  props: HomepageSectionRendererProps & {
    rendererMapping?: HomepageSectionRendererMapping;
    renderers?: Partial<HomepageSectionRendererRegistry>;
  },
): ReactNode {
  const { rendererMapping, renderers, ...rendererProps } = props;
  const registry = createHomepageRendererRegistry(
    {
      ...LEGACY_CLASSIC_HOMEPAGE_RENDERERS,
      ...KAWAII_FASHION_HOMEPAGE_RENDERERS,
    },
    renderers,
  );
  const renderer = resolveHomepageRenderer(
    props.section.type,
    registry,
    rendererMapping,
  );
  return renderer ? renderer(rendererProps) : null;
}

export function HomepageSectionView(
  props: HomepageSectionRendererProps & {
    rendererMapping?: HomepageSectionRendererMapping;
    renderers?: Partial<HomepageSectionRendererRegistry>;
  },
) {
  return renderHomepageSection(props);
}

export default function HomepageRenderer({
  sections,
  data,
  preview = false,
  useLiveBindingsInPreview = false,
  primaryBannerId,
  rendererMapping,
  renderers,
  resolveImageUrl,
}: HomepageRendererProps) {
  const headingBannerId =
    primaryBannerId ?? getPrimaryHomepageBannerId(sections, data);
  const rendered: { id: string; node: ReactNode }[] = [];

  for (const section of sections) {
    const node = renderHomepageSection({
      section,
      data,
      preview,
      useLiveBindingsInPreview,
      primaryBannerId: headingBannerId,
      rendererMapping,
      renderers,
      resolveImageUrl,
    });
    if (node) rendered.push({ id: section.id, node });
  }

  return (
    <div>
      {rendered.map(({ id, node }) => (
        <div key={id}>{node}</div>
      ))}
    </div>
  );
}
