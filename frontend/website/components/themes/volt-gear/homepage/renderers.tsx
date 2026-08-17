import {
  configString,
  configLimit,
  type HomepageSectionRenderer,
  type HomepageSectionRendererProps,
  type HomepageSectionRendererRegistry,
} from "@/components/HomePage/HomepageRenderer";
import { getHomepageSectionMetadata } from "@/lib/cms/homepageSections";
import { selectHomepageProducts } from "@/lib/products/homepageFeatured";
import VoltGearProductsCarousel from "./ProductsCarousel";

function VoltGearFeaturedRenderer({
  section,
  data,
  preview,
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
    <VoltGearProductsCarousel
      products={products}
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={configString(config, "eyebrow")}
      ctaLabel={configString(config, "cta_label") ?? "View all products"}
      ctaHref="/product"
      listLabel={configString(config, "product_list_label")}
      preview={preview}
    />
  );
}

export const VOLT_GEAR_HOMEPAGE_RENDERERS: Partial<HomepageSectionRendererRegistry> =
  {
    "volt-gear.featured": VoltGearFeaturedRenderer,
  } satisfies Partial<Record<string, HomepageSectionRenderer>>;