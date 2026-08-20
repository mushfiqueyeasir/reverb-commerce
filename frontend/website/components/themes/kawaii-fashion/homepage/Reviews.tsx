"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useMarqueeCarousel } from "@/components/Common/useMarqueeCarousel";
import type { TransformedReview } from "@/type/reviewType";

interface KawaiiFashionReviewsProps {
  reviews: TransformedReview[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  customerFallback?: string | null;
  bodyFallback?: string | null;
  itemLabelTemplate?: string | null;
  verifiedLabel?: string | null;
  ratingAriaTemplate?: string | null;
}

export default function KawaiiFashionReviews({
  reviews,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/reviews",
  customerFallback,
  bodyFallback,
  itemLabelTemplate,
  verifiedLabel,
  ratingAriaTemplate,
}: KawaiiFashionReviewsProps) {
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
  } = useMarqueeCarousel(2, 36);

  if (reviews.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-surface py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-[9999px] bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
      </div>
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div
          className="pointer-events-none absolute inset-y-0 left-4 z-10 w-8 bg-gradient-to-r from-surface to-transparent sm:left-6 sm:w-16 lg:left-10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-4 z-10 w-8 bg-gradient-to-l from-surface to-transparent sm:right-6 sm:w-16 lg:right-10"
          aria-hidden="true"
        />
        <div
          ref={trackRef}
          role="list"
          aria-label={title || "Customer reviews"}
          className="scrollbar-hide touch-auto select-none cursor-grab overflow-x-auto overscroll-x-contain active:cursor-grabbing"
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
          <div className="flex w-max">
            {[false, true].map((duplicate) => (
              <div
                key={duplicate ? "duplicate" : "original"}
                className="flex gap-4 pe-4 sm:gap-5 sm:pe-5 lg:gap-6 lg:pe-6"
                aria-hidden={duplicate || undefined}
              >
                {reviews.map((review, index) => (
                  <ReviewCard
                    key={`${review.id}-${duplicate ? "duplicate" : "original"}`}
                    review={review}
                    index={index}
                    duplicate={duplicate}
                    customerFallback={customerFallback}
                    bodyFallback={bodyFallback}
                    itemLabelTemplate={itemLabelTemplate}
                    verifiedLabel={verifiedLabel}
                    ratingAriaTemplate={ratingAriaTemplate}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({
  review,
  index,
  duplicate,
  customerFallback,
  bodyFallback,
  itemLabelTemplate,
  verifiedLabel,
  ratingAriaTemplate,
}: {
  review: TransformedReview;
  index: number;
  duplicate: boolean;
  customerFallback?: string | null;
  bodyFallback?: string | null;
  itemLabelTemplate?: string | null;
  verifiedLabel?: string | null;
  ratingAriaTemplate?: string | null;
}) {
  const rating =
    typeof review.rating === "number" && Number.isFinite(review.rating)
      ? Math.min(5, Math.max(0, review.rating))
      : null;
  const filled = rating === null ? 0 : Math.round(rating);
  const image = review.image?.trim();
  const name = review.customerName?.trim() || customerFallback?.trim();
  const body = review.body?.trim() || bodyFallback?.trim();
  const itemLabel = itemLabelTemplate
    ?.trim()
    .replaceAll("{number}", String(index + 1).padStart(2, "0"));
  const normalizedVerifiedLabel = verifiedLabel?.trim();
  const ratingLabel =
    rating === null
      ? undefined
      : ratingAriaTemplate
          ?.trim()
          .replaceAll("{rating}", rating.toFixed(1))
          .replaceAll("{maximum}", "5");

  return (
    <figure
      role="listitem"
      tabIndex={duplicate ? -1 : 0}
      className="flex h-[21rem] w-[min(50vw,21rem)] shrink-0 flex-col overflow-hidden border border-border bg-card p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:h-[22rem] sm:w-[23rem] sm:p-7 xl:w-[calc((min(100vw,1600px)-11rem)/5)] xl:p-5 2xl:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        {image ? (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-surface">
            <Image
              src={image}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-surface text-primary-readable">
            <Quote className="size-5" aria-hidden="true" />
          </span>
        )}
        {itemLabel ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {itemLabel}
          </span>
        ) : null}
      </div>
      {body ? (
        <blockquote
          title={body}
          className="mt-7 line-clamp-5 min-h-0 flex-1 overflow-hidden font-display text-xl font-medium leading-snug tracking-[-0.025em] text-foreground"
        >
          “{body}”
        </blockquote>
      ) : (
        <div className="min-h-0 flex-1" />
      )}
      <figcaption className="mt-6 shrink-0 border-t border-border pt-5">
        {rating !== null ? (
          <div
            className="flex gap-1 text-primary-readable"
            aria-label={ratingLabel}
            aria-hidden={ratingLabel ? undefined : true}
          >
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <Star
                key={starIndex}
                className={`size-3.5 ${
                  starIndex < filled ? "fill-primary" : "text-border"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : null}
        {name ? (
          <p className="mt-3 truncate text-sm font-semibold text-foreground">
            {name}
          </p>
        ) : null}
        {normalizedVerifiedLabel ? (
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {normalizedVerifiedLabel}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}
