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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {reviews.map((review, index) => {
            const rating = Math.min(5, Math.max(0, review.rating ?? 5));
            const filled = Math.round(rating);
            const image = review.image?.trim();
            const name = review.customerName?.trim() || "Verified customer";

            return (
              <figure
                key={review.id}
                className="flex min-h-[300px] flex-col border border-border bg-card p-6 sm:p-7"
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
                <blockquote className="mt-7 flex-1 font-display text-xl font-medium leading-snug tracking-[-0.025em] text-foreground">
                  “
                  {review.body?.trim() ||
                    "A lovely piece that feels just right."}
                  ”
                </blockquote>
                <figcaption className="mt-8 border-t border-border pt-5">
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
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {name}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Verified review
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
