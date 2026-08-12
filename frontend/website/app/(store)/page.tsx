import type { ReactNode } from "react";
import Hero from "@/components/HomePage/Hero";
import Marquee from "@/components/HomePage/Marquee";
import Category from "@/components/HomePage/Category";
import FeaturedProducts from "@/components/HomePage/FeaturedProducts";
import ReviewSlider from "@/components/HomePage/ReviewSlider";
import PromoStrip from "@/components/HomePage/PromoStrip";
import RichTextSection from "@/components/HomePage/RichTextSection";
import { getCategories } from "@/utility/getCategory";
import { getProducts, transformProduct } from "@/utility/getProducts";
import { getReviews, transformReview } from "@/utility/getReview";
import { getBanners } from "@/utility/getBanners";
import {
  getHomepageSections,
  type HomepageSection,
} from "@/utility/getHomepageSections";
import { getPromotionById, getPromotions } from "@/utility/getPromotion";
import { brandingImageUrl } from "@/utility/imageUrl";
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

function configNum(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const v = config[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
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
  const [banners, sections, categories, products, reviews, promotions] =
    await Promise.all([
      getBanners(),
      getHomepageSections(),
      getCategories(),
      getProducts(),
      getReviews(),
      getPromotions(),
    ]);

  const transformedReviews = reviews.map(transformReview);
  const allTransformed = products.map(transformProduct);
  const latestPromotion = promotions[0] ?? null;

  const renderSection = async (
    section: HomepageSection,
  ): Promise<ReactNode> => {
    const cfg = section.config ?? {};

    switch (section.type) {
      case "banner":
        return banners.length > 0 ? (
          <>
            <Hero
              banners={banners}
              description={
                configStr(cfg, "description") ?? DEFAULT_BANNER_DESCRIPTION
              }
              stats={configStats(cfg)}
            />
            {configBool(cfg, "show_marquee", true) ? (
              <Marquee items={configMarquee(cfg)} />
            ) : null}
          </>
        ) : null;

      case "categories":
        return categories.length > 0 ? (
          <Category
            categories={categories}
            title={section.title}
            subtitle={section.subtitle}
            eyebrow={configStr(cfg, "eyebrow")}
            ctaLabel={configStr(cfg, "cta_label")}
            ctaHref={configStr(cfg, "cta_url") ?? "/product"}
          />
        ) : null;

      case "featured": {
        const limit = configNum(cfg, "limit", 8);
        const featured = allTransformed.slice(0, limit);
        return featured.length > 0 ? (
          <FeaturedProducts
            products={featured}
            title={section.title}
            subtitle={section.subtitle}
            eyebrow={configStr(cfg, "eyebrow")}
            ctaLabel={configStr(cfg, "cta_label")}
            ctaHref={configStr(cfg, "cta_url") ?? "/product"}
          />
        ) : null;
      }

      case "reviews": {
        // Marquee works best with a fuller set; CMS limit still applies.
        const limit = configNum(cfg, "limit", 24);
        const slice = transformedReviews.slice(0, limit);
        return slice.length > 0 ? (
          <ReviewSlider
            reviews={slice}
            title={section.title}
            subtitle={section.subtitle}
            eyebrow={configStr(cfg, "eyebrow")}
            ctaLabel={configStr(cfg, "cta_label")}
            ctaHref={configStr(cfg, "cta_url") ?? "/reviews"}
          />
        ) : null;
      }

      case "promo": {
        const promoId = configStr(cfg, "promotion_id");
        const promotion = promoId
          ? ((await getPromotionById(promoId)) ?? latestPromotion)
          : latestPromotion;
        return promotion ? (
          <PromoStrip
            promotion={promotion}
            title={section.title}
            subtitle={section.subtitle}
            ctaHref={
              configStr(cfg, "cta_url") || promotion.ctaUrl || "/product"
            }
            ctaLabel={
              configStr(cfg, "cta_label") ||
              promotion.ctaLabel ||
              "Shop the drop"
            }
          />
        ) : null;
      }

      case "richtext":
        return (
          <RichTextSection
            title={section.title}
            subtitle={section.subtitle}
            body={section.body}
            config={section.config}
            imageUrl={brandingImageUrl(configStr(section.config, "image_path"))}
          />
        );

      default:
        return null;
    }
  };

  const rendered: { id: string; node: ReactNode }[] = [];
  for (const section of sections) {
    const node = await renderSection(section);
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
