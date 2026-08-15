"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useMarqueeCarousel } from "./useMarqueeCarousel";
import type { Category } from "@/type/categoryType";

interface KawaiiFashionCategoriesProps {
  categories: Category[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  categoryIds?: string[] | null;
  limit?: number;
}

function categoryHref(category: Category) {
  const slug = category.categoryUrl.current?.trim();
  return category.isDefault || !slug
    ? "/product"
    : `/product?category=${encodeURIComponent(slug)}`;
}

export default function KawaiiFashionCategories({
  categories,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
  categoryIds,
  limit = 5,
}: KawaiiFashionCategoriesProps) {
  const {
    trackRef,
    handlePointerDown,
    handleClickCapture,
    onMouseEnter,
    onMouseLeave,
  } = useMarqueeCarousel(3);

  const eligible = categories.filter(
    (category) => category.isDefault || !category.parentId,
  );
  const byId = new Map(eligible.map((category) => [category._id, category]));
  const selected = categoryIds
    ? categoryIds
        .map((id) => byId.get(id))
        .filter((category): category is Category => Boolean(category))
    : eligible;
  const visible = selected.slice(0, Math.max(1, Math.min(5, limit)));

  if (visible.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute -right-24 top-10 size-72 rounded-[9999px] bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          align="center"
        />
      </div>
      <div className="relative mx-auto mt-10 max-w-[1600px] sm:mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-16" />
        <div
          ref={trackRef}
          role="list"
          aria-label={title || "Categories"}
          className="scrollbar-hide touch-pan-y select-none cursor-grab overflow-x-auto px-4 active:cursor-grabbing sm:px-6 lg:px-10"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onPointerDown={handlePointerDown}
          onClickCapture={handleClickCapture}
        >
          <div className="flex w-max gap-3 pe-3 sm:gap-5 sm:pe-5">
            {[0, 1, 2].map((copy) => (
              <div
                key={copy}
                className="flex gap-3 pe-3 sm:gap-5 sm:pe-5"
                aria-hidden={copy > 0 || undefined}
              >
                {visible.map((category) => (
                  <div
                    key={`${category._id}-${copy}`}
                    className="w-[min(62vw,13.5rem)] shrink-0"
                  >
                    <article className="group">
                      <Link
                        href={categoryHref(category)}
                        tabIndex={copy > 0 ? -1 : undefined}
                        draggable={false}
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                        aria-label={category.categoryName}
                      >
                        <div className="relative aspect-[4/5] overflow-hidden border border-border bg-surface">
                          {category.imageUrl ? (
                            <Image
                              src={category.imageUrl}
                              alt={category.categoryName}
                              fill
                              draggable={false}
                              sizes="(max-width: 640px) 62vw, 13.5rem"
                              className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_26%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_30%),linear-gradient(145deg,var(--card),var(--surface))]" />
                          )}
                          <span className="absolute bottom-3 right-3 grid size-10 place-items-center bg-background/90 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground motion-reduce:transition-none sm:bottom-4 sm:right-4">
                            <ArrowUpRight
                              className="size-4"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                        <div className="pt-4">
                          <h3 className="truncate font-display text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                            {category.categoryName}
                          </h3>
                          {category.categoryDescription?.trim() ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">
                              {category.categoryDescription.trim()}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </article>
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
