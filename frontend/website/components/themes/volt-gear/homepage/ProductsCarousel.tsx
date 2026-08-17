"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useId } from "react";
import ProductCard from "@/components/Common/ProductCard";
import { useMarqueeCarousel } from "@/components/Common/useMarqueeCarousel";
import {
  V2Aurora,
  V2Grid,
  V2Particles,
  V2Reveal,
} from "@/components/HomePage/V2Motion";
import type { TransformedProduct } from "@/type/productType";

export interface VoltGearProductsCarouselProps {
  products: TransformedProduct[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  listLabel?: string | null;
  preview?: boolean;
}

export default function VoltGearProductsCarousel({
  products,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
  listLabel,
  preview = false,
}: VoltGearProductsCarouselProps) {
  const headingId = useId();
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
    <section
      className="relative overflow-hidden py-20 motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:py-28 lg:py-40"
      aria-labelledby={headingId}
    >
      <V2Aurora className="opacity-45" />
      <V2Grid className="opacity-[0.1]" />
      <V2Particles className="opacity-30" />
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10">
        <V2Reveal
          className="mb-12 grid gap-7 border-b border-border pb-10 lg:mb-16 lg:grid-cols-12 lg:items-end lg:pb-14"
          initiallyVisible={preview}
        >
          <div className="lg:col-span-8">
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-[11px]">
              <span className="h-px w-10 bg-primary" aria-hidden="true" />
              {eyebrow || "The featured runway"}
            </div>
            <h2
              id={headingId}
              className="max-w-5xl font-display text-5xl font-bold leading-[0.84] tracking-[-0.06em] sm:text-7xl lg:text-[6.5rem]"
            >
              {title || "One look ahead."}
            </h2>
            {subtitle ? (
              <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-7 lg:col-span-4 lg:items-end">
            {ctaLabel ? (
              <Link
                href={ctaHref}
                className="group inline-flex min-h-11 items-center gap-3 border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-primary hover:text-primary-readable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              >
                {ctaLabel}
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>
        </V2Reveal>
      </div>

      <div className="relative mx-auto mt-10 max-w-[1600px] sm:mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-16" />
        <div
          ref={trackRef}
          role="list"
          aria-label={normalizedListLabel || undefined}
          className="scrollbar-hide touch-auto select-none cursor-grab overflow-x-auto overscroll-x-contain px-5 active:cursor-grabbing sm:px-6 lg:px-10"
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
                    className="w-[min(76vw,17rem)] shrink-0"
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
