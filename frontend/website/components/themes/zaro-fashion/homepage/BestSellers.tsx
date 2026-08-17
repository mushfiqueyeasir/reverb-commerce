"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/Common/ProductCard";
import ZaroSectionHeading from "./SectionHeading";
import { cn } from "@/lib/utils";
import type { TransformedProduct } from "@/type/productType";

interface ZaroBestSellersProps {
  products: TransformedProduct[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  tabLabels?: Partial<Record<BestSellerTab, string>> | null;
}

type BestSellerTab = "all" | "men" | "women" | "new";

const DEFAULT_TAB_LABELS: Record<BestSellerTab, string> = {
  all: "All",
  men: "Men",
  women: "Women",
  new: "New Arrivals",
};

export default function ZaroBestSellers({
  products,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
  tabLabels,
}: ZaroBestSellersProps) {
  const [activeTab, setActiveTab] = useState<BestSellerTab>("all");

  const tabs: BestSellerTab[] = ["all", "men", "women", "new"];
  const labels: Record<BestSellerTab, string> = {
    ...DEFAULT_TAB_LABELS,
    ...(tabLabels ?? {}),
  };

  const filtered = useMemo(() => {
    if (activeTab === "all") return products;
    if (activeTab === "new") {
      return [...products]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 4);
    }
    const keywords =
      activeTab === "men" ? ["men", "man", "male"] : ["women", "woman", "girl"];
    const matches = products.filter((product) =>
      product.categories.some((category) => {
        const name =
          `${category.categoryName} ${category.categoryDescription ?? ""}`.toLowerCase();
        return keywords.some((keyword) => name.includes(keyword));
      }),
    );
    return matches.length ? matches : products;
  }, [activeTab, products]);

  if (products.length === 0) return null;

  return (
    <section className="bg-[#f9f5f3] py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-[40px]">
        <ZaroSectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
        <div
          role="tablist"
          aria-label={title || "Best sellers"}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "min-h-10 rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1b] focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                activeTab === tab
                  ? "bg-[#1f1f1b] text-white"
                  : "border border-[#dedad9] bg-white text-[#7e796a] hover:border-[#1f1f1b] hover:text-[#1f1f1b]",
              )}
            >
              {labels[tab]}
            </button>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              image={product.image}
              hoverImage={product.hoverImage}
              images={product.images}
              originalPrice={product.originalPrice}
              currentPrice={product.currentPrice}
              discount={product.discount}
              href={product.href}
              stock={product.stock}
              sizingMode={product.sizingMode}
              sizeChart={product.sizeChart}
              label={product.categories[0]?.categoryName}
              variant="zaro-fashion"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
