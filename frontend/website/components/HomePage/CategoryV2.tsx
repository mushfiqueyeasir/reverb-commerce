"use client";

import { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  V2Aurora,
  V2Grid,
  V2Particles,
  V2Reveal,
} from "@/components/HomePage/V2Motion";
import type { Category } from "@/type/categoryType";

export interface CategoryV2Props {
  categories: Category[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  limit?: number;
  preview?: boolean;
}

const contactSheetSlots = [
  "w-full aspect-[4/5] sm:aspect-[16/11] lg:col-span-7 lg:row-span-6 lg:aspect-auto lg:min-h-[720px] lg:w-full",
  "ml-auto w-[86%] aspect-[3/4] sm:w-[78%] lg:col-span-5 lg:row-span-2 lg:aspect-auto lg:mx-0 lg:w-full",
  "mr-auto w-[92%] aspect-[5/4] sm:w-[82%] lg:col-span-5 lg:row-span-2 lg:aspect-auto lg:mx-0 lg:w-full",
  "ml-auto w-[84%] aspect-[3/4] sm:w-[74%] lg:col-span-5 lg:row-span-2 lg:aspect-auto lg:mx-0 lg:w-full",
  "mr-auto min-h-[280px] w-[94%] aspect-[4/3] sm:min-h-0 sm:w-[88%] sm:aspect-[16/10] lg:col-span-8 lg:row-span-4 lg:aspect-auto lg:mx-0 lg:w-full",
  "ml-auto w-[88%] aspect-[4/5] sm:w-[76%] lg:col-span-5 lg:row-span-4 lg:aspect-auto lg:mx-0 lg:w-full",
  "mr-auto w-full aspect-[5/4] sm:w-[90%] lg:col-span-7 lg:row-span-4 lg:aspect-auto lg:mx-0 lg:w-full",
];

function categoryHref(category: Category) {
  const slug = category.categoryUrl.current?.trim();
  return category.isDefault || !slug
    ? "/product"
    : `/product?category=${encodeURIComponent(slug)}`;
}

export default function CategoryV2({
  categories,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
  limit,
  preview = false,
}: CategoryV2Props) {
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const headingId = useId();
  const visibleCategories = categories.slice(
    0,
    typeof limit === "number"
      ? Math.max(0, Math.floor(limit))
      : categories.length,
  );

  if (visibleCategories.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden py-20 motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:py-28 lg:py-40"
      aria-labelledby={headingId}
    >
      <V2Aurora className="opacity-45" />
      <V2Grid className="opacity-[0.1]" />
      <V2Particles className="opacity-30" />
      <motion.div
        className="pointer-events-none absolute -right-[4vw] top-32 select-none whitespace-nowrap font-display text-[clamp(6rem,17vw,17rem)] font-black uppercase leading-none tracking-[-0.09em] text-transparent opacity-[0.09] [-webkit-text-stroke:1px_rgb(var(--v2-foreground-rgb)/0.7)]"
        animate={reduceMotion ? undefined : { x: [0, -28, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        Index
      </motion.div>
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10">
        <V2Reveal
          className="mb-14 grid gap-8 border-b border-border pb-10 lg:mb-20 lg:grid-cols-12 lg:items-end lg:pb-14"
          initiallyVisible={preview}
        >
          <div className="lg:col-span-8">
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-[11px]">
              <span className="h-px w-10 bg-primary" aria-hidden="true" />
              {eyebrow || "The category index"}
            </div>
            <h2
              id={headingId}
              className="max-w-5xl font-display text-5xl font-bold leading-[0.84] tracking-[-0.06em] sm:text-7xl lg:text-[6.5rem]"
            >
              {title || "Choose your chapter."}
            </h2>
          </div>
          <div className="flex flex-col items-start gap-7 lg:col-span-4 lg:items-end">
            <div className="inline-flex items-center gap-3 border border-border bg-background/55 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-md sm:text-[10px]">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_rgb(var(--v2-primary-rgb)/0.9)]" />
              {String(visibleCategories.length).padStart(2, "0")} chapters
              online
            </div>
            {subtitle ? (
              <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base lg:text-right">
                {subtitle}
              </p>
            ) : null}
            {ctaLabel ? (
              <Link
                href={ctaHref}
                className="group inline-flex min-h-11 items-center gap-3 border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              >
                {ctaLabel}
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>
        </V2Reveal>

        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:grid-flow-dense lg:auto-rows-[112px] lg:gap-6">
          {visibleCategories.map((category, index) => (
            <motion.article
              key={category._id}
              className={`group relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_80px_rgb(0_0_0/0.2)] transition-shadow duration-500 hover:shadow-[0_32px_100px_rgb(var(--v2-primary-rgb)/0.2)] ${contactSheetSlots[index % contactSheetSlots.length]}`}
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, clipPath: "inset(0 0 100% 0)" }
              }
              whileInView={
                reduceMotion
                  ? undefined
                  : { opacity: 1, clipPath: "inset(0 0 0% 0)" }
              }
              whileHover={reduceMotion ? undefined : "hover"}
              variants={{
                hover: {
                  y: -10,
                  rotate: index % 2 === 0 ? -0.45 : 0.45,
                },
              }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{
                duration: 0.9,
                delay: Math.min(index * 0.06, 0.36),
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={categoryHref(category)}
                className="relative block h-full min-h-[inherit] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                aria-label={`Explore ${category.categoryName}`}
              >
                <motion.div
                  className="absolute -inset-y-5 inset-x-0"
                  variants={{
                    hover: { scale: 1.045, y: -7 },
                  }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.categoryName}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 88vw, 58vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgb(var(--v2-primary-rgb)/0.34),transparent_42%),linear-gradient(145deg,var(--card),var(--surface))]" />
                  )}
                </motion.div>
                <div
                  className="absolute inset-0 bg-[radial-gradient(circle_at_82%_14%,rgb(var(--v2-primary-rgb)/0.3),transparent_34%),linear-gradient(to_top,var(--background),color-mix(in_srgb,var(--background)_28%,transparent)_54%,transparent)]"
                  aria-hidden="true"
                />
                <motion.div
                  className="absolute -left-1/3 top-0 h-full w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-foreground/25 to-transparent opacity-0"
                  variants={{
                    hover: {
                      x: ["0%", "650%"],
                      opacity: [0, 0.75, 0],
                    },
                  }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute -bottom-[0.14em] right-2 font-display text-[clamp(7rem,18vw,15rem)] font-black leading-none tracking-[-0.1em] text-transparent opacity-25 [-webkit-text-stroke:1px_rgb(var(--v2-foreground-rgb)/0.6)]"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-primary shadow-[0_0_24px_rgb(var(--v2-primary-rgb)/0.9)] transition-transform duration-500 group-hover:scale-x-100" />
                <div className="absolute inset-0 z-10 flex flex-col justify-between p-5 sm:p-7 lg:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground backdrop-blur-md sm:text-[10px]">
                      <span className="text-primary">Chapter</span>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <motion.span
                      className="grid size-11 place-items-center rounded-full border border-border bg-background/75 text-foreground backdrop-blur-md"
                      variants={{ hover: { rotate: 8, x: 3, y: -3 } }}
                      transition={{ duration: 0.35 }}
                    >
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </motion.span>
                  </div>
                  <div className="max-w-2xl">
                    {category.categoryDescription ? (
                      <p className="mb-3 line-clamp-2 max-w-md font-mono text-[9px] uppercase leading-5 tracking-[0.22em] text-muted-foreground sm:text-[10px]">
                        {category.categoryDescription}
                      </p>
                    ) : null}
                    <h3
                      className={`font-display font-bold leading-[0.9] tracking-[-0.05em] ${index === 0 ? "text-5xl sm:text-7xl lg:text-8xl" : "text-4xl sm:text-5xl"}`}
                    >
                      {category.categoryName}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
