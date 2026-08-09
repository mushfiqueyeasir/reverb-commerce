import { BadgeCheck, Quote, Star } from "lucide-react";
import ImageLoader from "./ImageLoader";
import { cn } from "@/lib/utils";
import type { TransformedReview } from "@/type/reviewType";

interface ReviewCardProps {
  review: TransformedReview;
  index?: number;
  className?: string;
}

function Rating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5 text-primary"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "size-3.5",
            index < rating ? "fill-primary text-primary" : "text-border",
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewCard({
  review,
  index = 0,
  className,
}: ReviewCardProps) {
  const rating = Math.min(5, Math.max(0, Math.round(review.rating ?? 0)));
  const name = review.customerName?.trim() || "VE Gear customer";
  const body = review.body?.trim();
  const hasImage = Boolean(review.image);
  const noteNumber = String(index + 1).padStart(2, "0");

  return (
    <article
      className={cn(
        "group w-full overflow-hidden rounded-[2rem] border border-border bg-card transition duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_28px_75px_-45px_rgb(var(--primary-rgb)/0.65)]",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden border-b border-border bg-surface">
        {hasImage ? (
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(circle at 80% 15%, rgb(var(--primary-rgb) / 0.16), transparent 45%)",
              }}
              aria-hidden
            />
            <ImageLoader
              src={review.image}
              alt={`Review by ${name}`}
              width={900}
              height={1100}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="relative h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-background" />
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5">
          <div className="rounded-full border border-white/20 bg-black/45 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.25em] text-white backdrop-blur-md">
            Note {noteNumber}
          </div>
          {rating > 0 ? (
            <div className="rounded-full border border-white/20 bg-black/45 px-3 py-2 backdrop-blur-md">
              <Rating rating={rating} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {body ? (
          <blockquote className="font-display text-lg font-medium leading-relaxed tracking-[-0.015em] text-foreground sm:text-xl">
            &ldquo;{body}&rdquo;
          </blockquote>
        ) : null}
        <footer
          className={cn(
            "flex items-end justify-between gap-4 border-t border-border pt-5",
            body && "mt-6",
          )}
        >
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {name}
              <BadgeCheck className="size-3.5 text-primary" />
            </div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground">
              Verified community review
            </div>
          </div>
          <Quote
            className="size-7 shrink-0 text-primary/70"
            strokeWidth={1.5}
          />
        </footer>
      </div>
    </article>
  );
}
