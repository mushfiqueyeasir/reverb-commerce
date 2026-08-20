"use client";

import ProductCard from "@/components/Common/ProductCard";
import SectionHeading from "./SectionHeading";
import { useMarqueeCarousel } from "@/components/Common/useMarqueeCarousel";
import type { TransformedProduct } from "@/type/productType";

interface KawaiiFashionFeaturedProductsProps {
  products: TransformedProduct[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  listLabel?: string | null;
  uncategorizedLabelTemplate?: string | null;
}

export default function KawaiiFashionFeaturedProducts({
  products,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
  listLabel,
}: KawaiiFashionFeaturedProductsProps) {
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

  const normalizedListLabel = listLabel?.trim();

  if (products.length === 0) return null;

  return (
    <section className="relative bg-surface py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
      </div>
      <div className="relative mx-auto mt-10 max-w-[1600px] sm:mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-surface to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-surface to-transparent sm:w-16" />
        <div
          ref={trackRef}
          role="list"
          aria-label={normalizedListLabel || undefined}
          className="scrollbar-hide touch-auto select-none cursor-grab overflow-x-auto overscroll-x-contain px-4 active:cursor-grabbing sm:px-6 lg:px-10"
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
          <div className="flex w-max gap-3 pe-3 sm:gap-5 sm:pe-5">
            {[false, true].map((duplicate) => (
              <div
                key={duplicate ? "duplicate" : "original"}
                className="flex gap-3 pe-3 sm:gap-5 sm:pe-5"
                aria-hidden={duplicate || undefined}
              >
                {products.map((product) => (
                  <div
                    key={`${product.id}-${duplicate ? "duplicate" : "original"}`}
                    className="w-[min(32vw,17rem)] shrink-0"
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
                      variant="kawaii-fashion"
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
