import Link from "next/link";
import { ArrowDown, ArrowRight, Star } from "lucide-react";
import ReviewCard from "@/components/Common/ReviewCard";
import type { TransformedReview } from "@/type/reviewType";

export default function ReviewPageScreen({
  reviews,
  storeName,
}: {
  reviews: TransformedReview[];
  storeName: string;
}) {
  const ratings = reviews
    .map((review) => Number(review.rating) || 0)
    .filter((rating) => rating > 0);
  const averageRating = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : 0;

  return (
    <main className="overflow-hidden pb-24 pt-24 md:pt-36">
      <section className="relative mx-auto max-w-[1600px] px-6 md:px-10">
        <div
          className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--primary-rgb) / 0.17) 0%, transparent 68%)",
          }}
          aria-hidden
        />

        <div className="relative grid items-end gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:pb-16">
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-primary sm:text-[11px]">
              <span className="h-px w-10 bg-primary" />
              Customer stories
            </div>
            <h1 className="mt-5 max-w-5xl font-display text-[clamp(3.4rem,9vw,8.5rem)] font-bold leading-[0.82] tracking-[-0.065em] text-foreground">
              Used daily.
              <br />
              <span className="italic text-primary">Rated honestly.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Real experiences and the products customers keep reaching for. No
              scripts. Just the {storeName} community in their own words.
            </p>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-1">
            <div className="border-r border-border p-5 sm:p-6 lg:border-b lg:border-r-0">
              <div className="flex items-end gap-2">
                <span className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  {averageRating ? averageRating.toFixed(1) : "—"}
                </span>
                <Star className="mb-1.5 size-5 fill-primary text-primary" />
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                Community rating
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                {String(reviews.length).padStart(2, "0")}
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                Published stories
              </div>
            </div>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="mt-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[10px]">
            Scroll for the field notes
            <ArrowDown className="size-3.5 animate-bounce text-primary" />
          </div>
        ) : null}
      </section>

      <section className="mx-auto mt-16 max-w-[1600px] px-6 md:mt-24 md:px-10">
        <div className="mb-10 flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
              The community archive
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Field notes.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground sm:text-right">
            Product notes and honest reactions from people who put each item to
            use.
          </p>
        </div>

        {reviews.length > 0 ? (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {reviews.map((review, index) => (
              <div key={review.id} className="mb-5 break-inside-avoid">
                <ReviewCard review={review} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border py-20 text-center">
            <p className="font-display text-3xl font-semibold tracking-tight">
              The first field note is coming soon.
            </p>
            <p className="mt-3 text-muted-foreground">
              Check back for stories from the {storeName} community.
            </p>
          </div>
        )}
      </section>

      {reviews.length > 0 ? (
        <section className="mx-auto mt-24 max-w-[1600px] px-6 md:mt-32 md:px-10">
          <div className="flex flex-col gap-7 rounded-[2rem] border border-primary/25 bg-card p-7 sm:p-10 md:flex-row md:items-center md:justify-between md:rounded-[2.5rem] lg:p-12">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-primary">
                Your turn
              </p>
              <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Find the piece you&apos;ll have a story about.
              </h2>
            </div>
            <Link
              href="/product"
              className="group inline-flex min-h-14 shrink-0 items-center justify-between gap-8 rounded-full bg-primary px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition hover:brightness-110 sm:px-8"
            >
              Explore products
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
