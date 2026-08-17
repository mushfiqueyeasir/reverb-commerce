import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ZaroSectionHeading from "./SectionHeading";
import { safeZaroHref } from "@/components/themes/zaro-fashion/safeHref";
import type { TransformedReview } from "@/type/reviewType";

interface ZaroInsiderProps {
  reviews: TransformedReview[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  dateLabel?: string | null;
}

const INSIDER_FALLBACKS = [
  "/images/themes/zaro-fashion/blog-1.jpg",
  "/images/themes/zaro-fashion/blog-2.jpg",
  "/images/themes/zaro-fashion/blog-3.jpg",
];

const INSIDER_CATEGORIES = ["Trending now", "Style guides", "The edit"];

export default function ZaroInsider({
  reviews,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/reviews",
  dateLabel = "Fashion Insider",
}: ZaroInsiderProps) {
  const cards = reviews.slice(0, 3);

  if (cards.length === 0) return null;

  return (
    <section className="border-t border-[#dedad9] bg-[#f9f5f3] py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-[40px]">
        <ZaroSectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {cards.map((review, index) => {
            const image = review.image?.trim() || INSIDER_FALLBACKS[index];
            const name = review.customerName?.trim();
            const body =
              review.body?.trim() ||
              "A closer look at the pieces shaping this season's wardrobe.";
            return (
              <article key={review.id} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
                  <Image
                    src={image}
                    alt={name || ""}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#1f1f1b] backdrop-blur-sm">
                    {INSIDER_CATEGORIES[index % INSIDER_CATEGORIES.length]}
                  </span>
                </div>
                <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#7e796a]">
                  {dateLabel}
                </p>
                {name ? (
                  <h3 className="mt-2 line-clamp-2 font-display text-2xl font-medium leading-snug text-[#1f1f1b] transition-colors group-hover:text-[#7e796a]">
                    {name}
                  </h3>
                ) : null}
                <p className="mt-3 line-clamp-2 text-base font-medium leading-relaxed text-[#7e796a]">
                  {body}
                </p>
                <Link
                  href={safeZaroHref(ctaHref, "/reviews")}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1b] transition-colors hover:text-[#7e796a]"
                >
                  Read article
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
