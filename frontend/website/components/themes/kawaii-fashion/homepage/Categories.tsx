import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "./SectionHeading";
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
  limit = 8,
}: KawaiiFashionCategoriesProps) {
  const eligible = categories.filter(
    (category) => category.isDefault || !category.parentId,
  );
  const byId = new Map(eligible.map((category) => [category._id, category]));
  const selected = categoryIds
    ? categoryIds
        .map((id) => byId.get(id))
        .filter((category): category is Category => Boolean(category))
    : eligible;
  const visible = selected.slice(0, Math.max(1, Math.min(8, limit)));

  if (visible.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute -right-24 top-10 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1500px] px-5 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow || "Shop by mood"}
          title={title || "Find your next favorite"}
          subtitle={subtitle}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          align="center"
        />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7">
          {visible.map((category, index) => (
            <article key={category._id} className="group min-w-0">
              <Link
                href={categoryHref(category)}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                aria-label={`Shop ${category.categoryName}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden border border-border bg-surface">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.categoryName}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_26%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_30%),linear-gradient(145deg,var(--card),var(--surface))]" />
                  )}
                  <span className="absolute left-3 top-3 border border-background/70 bg-background/90 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur-sm sm:left-4 sm:top-4 sm:text-[10px]">
                    Edit {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-3 right-3 grid size-10 place-items-center bg-background/90 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground motion-reduce:transition-none sm:bottom-4 sm:right-4">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="pt-4">
                  <h3 className="truncate font-display text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                    {category.categoryName}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">
                    {category.categoryDescription ||
                      "A fresh edit for every day."}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
