import Image from "next/image";
import { Quote, Star } from "lucide-react";
import SectionHeading from "./SectionHeading";
import type { TransformedReview } from "@/type/reviewType";

interface KawaiiFashionReviewsProps {
  reviews: TransformedReview[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
}

export default function KawaiiFashionReviews({
  reviews,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/reviews",
}: KawaiiFashionReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-surface py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1500px] px-5 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow || "Loved in real life"}
          title={title || "Notes from our community"}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
      </div>
      <div className="relative overflow-hidden motion-reduce:overflow-x-auto motion-reduce:pb-3">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-surface to-transparent sm:w-16"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-surface to-transparent sm:w-16"
          aria-hidden="true"
        />
        <div className="flex w-max animate-marquee-reviews hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none">
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
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({
  review,
  index,
  duplicate,
}: {
  review: TransformedReview;
  index: number;
  duplicate: boolean;
}) {
  const rating = Math.min(5, Math.max(0, review.rating ?? 5));
  const filled = Math.round(rating);
  const image = review.image?.trim();
  const name = review.customerName?.trim() || "Verified customer";
  const body = review.body?.trim() || "A lovely piece that feels just right.";

  return (
    <figure
      tabIndex={duplicate ? -1 : 0}
      className="flex h-[21rem] w-[min(82vw,21rem)] shrink-0 flex-col overflow-hidden border border-border bg-card p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:h-[22rem] sm:w-[23rem] sm:p-7 lg:w-[27rem]"
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
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-surface text-primary">
            <Quote className="size-5" aria-hidden="true" />
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Note {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <blockquote
        title={body}
        className="mt-7 line-clamp-5 min-h-0 flex-1 overflow-hidden font-display text-xl font-medium leading-snug tracking-[-0.025em] text-foreground"
      >
        “{body}”
      </blockquote>
      <figcaption className="mt-6 shrink-0 border-t border-border pt-5">
        <div
          className="flex gap-1 text-primary"
          aria-label={`${rating.toFixed(1)} out of 5 stars`}
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
        <p className="mt-3 truncate text-sm font-semibold text-foreground">
          {name}
        </p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Verified review
        </p>
      </figcaption>
    </figure>
  );
}
