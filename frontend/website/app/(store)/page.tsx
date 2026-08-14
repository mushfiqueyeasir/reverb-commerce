import type { ReactNode } from "react";
import Hero from "@/components/HomePage/Hero";
import BannerV2 from "@/components/HomePage/BannerV2";
import Marquee from "@/components/HomePage/Marquee";
import Category from "@/components/HomePage/Category";
import CategoryV2 from "@/components/HomePage/CategoryV2";
import FeaturedProducts from "@/components/HomePage/FeaturedProducts";
import FeaturedProductsV2 from "@/components/HomePage/FeaturedProductsV2";
import ReviewSlider from "@/components/HomePage/ReviewSlider";
import ReviewsV2 from "@/components/HomePage/ReviewsV2";
import PromoStrip from "@/components/HomePage/PromoStrip";
import PromoV2 from "@/components/HomePage/PromoV2";
import RichTextSection from "@/components/HomePage/RichTextSection";
import RichTextSectionV2 from "@/components/HomePage/RichTextSectionV2";
import { getCategories } from "@/utility/getCategory";
import { getProducts, transformProduct } from "@/utility/getProducts";
import { getReviews, transformReview } from "@/utility/getReview";
import { getBanners } from "@/utility/getBanners";
import {
  getHomepageSections,
  type HomepageSection,
} from "@/utility/getHomepageSections";
import { getPromotions } from "@/utility/getPromotion";
import { brandingImageUrl } from "@/utility/imageUrl";
import { getHomepageSectionMetadata } from "@/lib/cms/homepageSections";
import { sanitizeCmsHtml } from "@/lib/html/sanitize";
import { selectHomepageProducts } from "@/lib/products/homepageFeatured";
import type { Metadata } from "next";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getBaseSeoItem } from "@/utility/getSeoSettings";
import {
  DEFAULT_BANNER_DESCRIPTION,
  DEFAULT_BANNER_MARQUEE,
  DEFAULT_BANNER_STATS,
  type BannerStatItem,
} from "@/type/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getBaseSeoItem();
  return generateSeoMetadata(seo);
}

function configStr(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const v = config[key];
  return typeof v === "string" && v.trim() ? v : null;
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

function optionalConfigLimit(
  config: Record<string, unknown>,
): number | undefined {
  const value = config.limit;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(24, Math.max(1, Math.floor(value)));
}

function configBool(
  config: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const v = config[key];
  return typeof v === "boolean" ? v : fallback;
}

function configStats(config: Record<string, unknown>): BannerStatItem[] {
  const raw = config.stats;
  if (!Array.isArray(raw)) return DEFAULT_BANNER_STATS;
  const parsed = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      const value = typeof o.value === "string" ? o.value.trim() : "";
      if (!label && !value) return null;
      return { label: label || "—", value: value || "—" };
    })
    .filter((x): x is BannerStatItem => Boolean(x));
  return parsed.length ? parsed : DEFAULT_BANNER_STATS;
}

function configMarquee(config: Record<string, unknown>): string[] {
  const raw = config.marquee_items;
  if (!Array.isArray(raw)) return DEFAULT_BANNER_MARQUEE;
  const parsed = raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_BANNER_MARQUEE;
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
  ] = await Promise.all([
    getBanners("banner"),
    getBanners("banner_v2"),
    getHomepageSections(),
    getCategories(),
    getProducts(),
    getReviews(),
    getPromotions(),
  ]);

  const transformedReviews = reviews.map(transformReview);
  const allTransformed = products.map(transformProduct);
  const latestPromotion = promotions[0] ?? null;
  const primaryBannerId =
    (banners.length > 0
      ? sections.find((section) => section.type === "banner")?.id
      : undefined) ??
    (bannersV2.length > 0
      ? sections.find((section) => section.type === "banner_v2")?.id
      : undefined);

  const renderSection = (section: HomepageSection): ReactNode => {
    const metadata = getHomepageSectionMetadata(section.type);
    if (!metadata) return null;

    const cfg = section.config ?? {};
    const family = metadata.family;
    const isV2 = metadata.version === 2;

    switch (family) {
      case "banner": {
        const slides = isV2 ? bannersV2 : banners;
        if (slides.length === 0) return null;
        const description =
          configStr(cfg, "description") ?? DEFAULT_BANNER_DESCRIPTION;

        return isV2 ? (
          <BannerV2
            banners={slides}
            description={description}
            headingLevel={section.id === primaryBannerId ? "h1" : "h2"}
          />
        ) : (
          <>
            <Hero
              banners={slides}
              description={description}
              stats={configStats(cfg)}
            />
            {configBool(cfg, "show_marquee", true) ? (
              <Marquee items={configMarquee(cfg)} />
            ) : null}
          </>
        );
      }

      case "categories":
        if (categories.length === 0) return null;
        return isV2 ? (
          <CategoryV2
            categories={categories}
            title={section.title}
            subtitle={section.subtitle}
            eyebrow={configStr(cfg, "eyebrow")}
            ctaLabel={configStr(cfg, "cta_label")}
            ctaHref={configStr(cfg, "cta_url") ?? "/product"}
            limit={optionalConfigLimit(cfg)}
          />
        ) : (
          <Category
            categories={categories}
            title={section.title}
            subtitle={section.subtitle}
            eyebrow={configStr(cfg, "eyebrow")}
            ctaLabel={configStr(cfg, "cta_label")}
            ctaHref={configStr(cfg, "cta_url") ?? "/product"}
            categoryIds={configStringArray(cfg, "category_ids")}
          />
        );

      case "featured": {
        const featuredMaximum = isV2 ? 5 : 4;
        const featured = selectHomepageProducts(
          allTransformed,
          configLimit(cfg, featuredMaximum, featuredMaximum),
          featuredMaximum,
          metadata.productSelection,
        );
        if (featured.length === 0) return null;
        const props = {
          products: featured,
          title: section.title,
          subtitle: section.subtitle,
          eyebrow: configStr(cfg, "eyebrow"),
          ctaLabel: configStr(cfg, "cta_label") ?? "View all products",
          ctaHref: "/product",
        };
        return isV2 ? (
          <FeaturedProductsV2 {...props} />
        ) : (
          <FeaturedProducts {...props} />
        );
      }

      case "reviews": {
        const visibleReviews = transformedReviews.slice(
          0,
          configLimit(cfg, 24),
        );
        if (visibleReviews.length === 0) return null;
        const props = {
          reviews: visibleReviews,
          title: section.title,
          subtitle: section.subtitle,
          eyebrow: configStr(cfg, "eyebrow"),
          ctaLabel: configStr(cfg, "cta_label"),
          ctaHref: configStr(cfg, "cta_url") ?? "/reviews",
        };
        return isV2 ? <ReviewsV2 {...props} /> : <ReviewSlider {...props} />;
      }

      case "promo": {
        const promoId = configStr(cfg, "promotion_id");
        const promotion =
          promotions.find((candidate) => candidate._id === promoId) ??
          latestPromotion;
        if (!promotion) return null;
        const props = {
          promotion,
          title: section.title,
          subtitle: section.subtitle,
          ctaHref: configStr(cfg, "cta_url") || promotion.ctaUrl || "/product",
          ctaLabel:
            configStr(cfg, "cta_label") ||
            promotion.ctaLabel ||
            (isV2 ? "Shop offer" : "Shop the drop"),
        };
        return isV2 ? <PromoV2 {...props} /> : <PromoStrip {...props} />;
      }

      case "richtext": {
        const imageUrl =
          brandingImageUrl(configStr(cfg, "image_path")) ??
          (cfg.variant === "fabric"
            ? "/images/lovable/fabric-texture.jpg"
            : null);
        const body = section.body ? sanitizeCmsHtml(section.body) : null;
        const storyProps = {
          title: section.title,
          subtitle: section.subtitle,
          body,
          eyebrow: configStr(cfg, "eyebrow"),
          ctaLabel: configStr(cfg, "cta_label"),
          ctaHref: configStr(cfg, "cta_url"),
          config: cfg,
          imageUrl,
        };
        return isV2 ? (
          <RichTextSectionV2 {...storyProps} />
        ) : (
          <RichTextSection {...storyProps} />
        );
      }

      default: {
        const exhaustiveFamily: never = family;
        return exhaustiveFamily;
      }
    }
  };

  const rendered: { id: string; node: ReactNode }[] = [];
  for (const section of sections) {
    const node = renderSection(section);
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
