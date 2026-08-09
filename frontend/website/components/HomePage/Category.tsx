import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category as CategoryType } from "@/type/categoryType";

interface CategoryProps {
  categories: CategoryType[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
}

const spans = ["lg:col-span-2 lg:row-span-2", "", "", "lg:col-span-2"];

export default function Category({
  categories,
  title,
  subtitle,
  eyebrow,
}: CategoryProps) {
  if (categories.length === 0) return null;

  return (
    <section id="drops" className="relative py-16 sm:py-24 md:py-40">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <div className="mb-8 max-w-2xl sm:mb-14">
          <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <span className="h-px w-8 bg-primary" />
            {eyebrow || "Collections"}
          </div>
          <h2 className="font-display text-4xl font-bold leading-[0.9] tracking-tight sm:text-5xl md:text-7xl">
            {title || "Editorial"}{" "}
            <span className="italic text-primary">
              {subtitle?.split(" ")[0] || "chapters"}
            </span>
            {subtitle
              ? `, ${subtitle.split(" ").slice(1).join(" ")}`
              : ", engineered to ride."}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:h-[900px] lg:grid-cols-4 lg:grid-rows-2">
          {categories.map((category, i) => (
            <Link
              key={category._id}
              href={
                category.isDefault
                  ? "/product"
                  : `/product?category=${category.categoryUrl.current}`
              }
              className={`group relative min-h-[240px] overflow-hidden rounded-3xl border border-border sm:min-h-[280px] ${spans[i % spans.length]}`}
            >
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.categoryName}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                  className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-surface" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition-opacity group-hover:from-black/95" />
              <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-8">
                <div className="flex justify-end">
                  <span className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md transition group-hover:border-primary group-hover:bg-primary">
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    {category.categoryDescription || "Collection"}
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-display text-3xl font-bold tracking-tight md:text-5xl">
                    {category.categoryName}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
