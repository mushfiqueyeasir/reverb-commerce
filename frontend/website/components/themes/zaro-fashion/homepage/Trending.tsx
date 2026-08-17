"use client";

import ProductCard from "@/components/Common/ProductCard";
import { useMarqueeCarousel } from "@/components/Common/useMarqueeCarousel";
import ZaroSectionHeading from "./SectionHeading";
import type { TransformedProduct } from "@/type/productType";

interface ZaroTrendingProps {
  products: TransformedProduct[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
}

export default function ZaroTrending({
  products,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
}: ZaroTrendingProps) {
  const {
    trackRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleScroll,
    handleClickCapture,
    onDragStart,
    onPointerEnter,
    onPointerLeave,
    onFocusCapture,
    onBlurCapture,
  } = useMarqueeCarousel(2);

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
      </div>
      <div className="relative mx-auto mt-10 max-w-[1440px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#f9f5f3] to-transparent sm:w-12" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#f9f5f3] to-transparent sm:w-12" />
        <div
          ref={trackRef}
          role="list"
          aria-label={title || "Trending products"}
          className="scrollbar-hide touch-auto select-none cursor-grab overflow-x-auto overscroll-x-contain px-6 active:cursor-grabbing sm:px-10 lg:px-[40px]"
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onScroll={handleScroll}
          onFocusCapture={onFocusCapture}
          onBlurCapture={onBlurCapture}
          onClickCapture={handleClickCapture}
          onDragStart={onDragStart}
        >
          <div className="flex w-max gap-5 pe-5 sm:gap-6 sm:pe-6 lg:gap-8 lg:pe-8">
            {[false, true].map((duplicate) => (
              <div
                key={duplicate ? "duplicate" : "original"}
                className="flex gap-5 pe-5 sm:gap-6 sm:pe-6 lg:gap-8 lg:pe-8"
                aria-hidden={duplicate || undefined}
              >
                {products.map((product) => (
                  <div
                    key={`${product.id}-${duplicate ? "duplicate" : "original"}`}
                    className="w-[min(70vw,16rem)] shrink-0"
                  >
                    <ProductCard
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
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
