import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { TransformedReview } from "@/type/reviewType";

interface ReviewSliderProps {
  reviews: TransformedReview[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
}

function padAndLoop<T>(items: T[], min = 4): T[] {
  if (items.length === 0) return [];
  let base = [...items];
  while (base.length < min) {
    base = [...base, ...items];
  }
  return [...base, ...base];
}

/** Repeat photos until the track is wide enough to fill the container. */
function padPhotosForMarquee(
  items: TransformedReview[],
  minTiles = 14,
): TransformedReview[] {
  if (items.length === 0) return [];
  let base = [...items];
  while (base.length < minTiles) {
    base = [...base, ...items];
  }
  return [...base, ...base];
}

function QuoteCard({ review }: { review: TransformedReview }) {
  const rating = Math.min(5, Math.max(0, Math.round(review.rating ?? 5)));
  const name = review.customerName?.trim() || "Store customer";
  const body = review.body?.trim() || "Premium stitch, zero compromises.";

  return (
    <div className="w-[280px] shrink-0 rounded-2xl border border-border bg-card p-6 sm:w-[340px] sm:p-8">
      <div
        className="flex gap-0.5 text-primary"
        aria-label={`${rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < rating
                ? "h-4 w-4 fill-primary text-primary"
                : "h-4 w-4 text-border"
            }
          />
        ))}
      </div>
      <p className="mt-4 line-clamp-5 text-base leading-relaxed sm:text-lg">
        &ldquo;{body}&rdquo;
      </p>
      <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        — {name}
      </div>
    </div>
  );
}

export default function ReviewSlider({
  reviews,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/reviews",
}: ReviewSliderProps) {
  if (reviews.length === 0) return null;

  const photos = reviews.filter((r) => r.image);
  const quotes = reviews.filter((r) => r.body?.trim() || r.customerName);

  const photoRow = padPhotosForMarquee(photos, 14);
  const quoteSource = quotes.length > 0 ? quotes : reviews;
  const quoteRow = padAndLoop(quoteSource, 4);

  return (
    <section className="relative py-16 sm:py-24 md:py-40">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" />
              {eyebrow || subtitle || "Community"}
            </div>
            <h2 className="font-display text-4xl font-bold leading-[0.9] tracking-tight sm:text-5xl md:text-6xl">
              {title ? (
                <>
                  {title.replace(/\.$/, "").split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="italic text-primary">
                    {title.replace(/\.$/, "").split(" ").slice(-1)[0]}
                  </span>
                  .
                </>
              ) : (
                <>
                  Worn by the{" "}
                  <span className="italic text-primary">customers</span>.
                </>
              )}
            </h2>
          </div>
          {ctaLabel ? (
            <Link
              href={ctaHref}
              className="inline-flex min-h-11 shrink-0 items-center font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              {ctaLabel} →
            </Link>
          ) : null}
        </div>

        {photoRow.length > 0 && (
          <div className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-12"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-12"
              aria-hidden
            />
            <div className="flex w-max animate-marquee-reviews-reverse gap-2 pe-2 hover:[animation-play-state:paused] sm:gap-3 sm:pe-3">
              {photoRow.map((review, i) => (
                <div
                  key={`${review.id}-p-${i}`}
                  className="group relative aspect-square w-40 shrink-0 overflow-hidden rounded-2xl border border-border sm:w-48 md:w-56 lg:w-64"
                >
                  <Image
                    src={review.image}
                    alt={review.customerName || "Review"}
                    fill
                    sizes="256px"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
                </div>
              ))}
            </div>
          </div>
        )}

        {quoteRow.length > 0 && (
          <div className="relative mt-12 overflow-hidden sm:mt-16">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-12"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-12"
              aria-hidden
            />
            <div className="flex w-max animate-marquee-reviews gap-3 pe-3 hover:[animation-play-state:paused] sm:gap-4 sm:pe-4">
              {quoteRow.map((review, i) => (
                <QuoteCard key={`${review.id}-q-${i}`} review={review} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
