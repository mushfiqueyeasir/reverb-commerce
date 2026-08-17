"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { safeZaroHref } from "@/components/themes/zaro-fashion/safeHref";
import type { Category } from "@/type/categoryType";

interface ZaroFeaturedCollectionsProps {
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

function CollectionCard({
  category,
  index,
  mobile = false,
}: {
  category: Category;
  index: number;
  mobile?: boolean;
}) {
  const description = category.categoryDescription?.trim();

  return (
    <article className={mobile ? "w-full" : "w-[500px] shrink-0 xl:w-[700px]"}>
      <div className="relative">
        <Link
          href={categoryHref(category)}
          className="group block bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1b] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f9f5f3]"
        >
          <div className="relative aspect-[7/6] overflow-hidden bg-[#e8e3e1]">
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt={category.categoryName}
                fill
                sizes={
                  mobile
                    ? "calc(100vw - 50px)"
                    : "(max-width: 1199px) 500px, 700px"
                }
                className="object-cover transition duration-[600ms] ease-[cubic-bezier(.44,0,.56,1)] group-hover:scale-105 group-hover:-rotate-1 motion-reduce:transform-none motion-reduce:transition-none"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#f0e6dc] to-[#cec8d4]" />
            )}
          </div>
        </Link>
        {!mobile && description ? (
          <motion.p
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.35 }}
            transition={{ type: "spring", bounce: 0.6, duration: 3 }}
            className="absolute -left-8 bottom-12 max-w-[300px] rounded-full border border-[#dedad9] bg-[#f9f5f3] px-5 py-3 text-sm font-medium leading-relaxed text-[#1f1f1b] xl:-left-10 xl:bottom-16 xl:px-6 xl:py-4"
          >
            {description}
          </motion.p>
        ) : null}
      </div>
      <Link
        href={categoryHref(category)}
        className={`group flex items-end justify-between gap-6 ${mobile ? "pt-4" : "pt-5 xl:pt-8"}`}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7e796a]">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-1 font-display text-3xl font-medium leading-tight text-[#1f1f1b] xl:text-5xl">
            {category.categoryName}
          </h3>
          {mobile && description ? (
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#7e796a]">
              {description}
            </p>
          ) : null}
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#1f1f1b] text-[#1f1f1b] transition-colors group-hover:bg-[#1f1f1b] group-hover:text-white">
          <ArrowUpRight className="size-5" aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}

export default function ZaroFeaturedCollections({
  categories,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
  categoryIds,
  limit = 3,
}: ZaroFeaturedCollectionsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const stripX = useTransform(
    scrollYProgress,
    [0, 0.24, 0.62, 1],
    [1400, 1100, 550, 0],
  );
  const introOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.24],
    [1, 1, 0],
  );
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const eligible = categories.filter(
    (category) => category.isDefault || !category.parentId,
  );
  const byId = new Map(eligible.map((category) => [category._id, category]));
  const selected = categoryIds
    ? categoryIds
        .map((id) => byId.get(id))
        .filter((category): category is Category => Boolean(category))
    : eligible;
  const visible = selected.slice(0, Math.max(1, Math.min(3, limit)));

  if (visible.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-clip bg-[#f9f5f3] px-6 pb-12 pt-14 sm:px-8 sm:pb-20 md:h-[calc(100vh+2212px)] md:pt-0 xl:h-[calc(100vh+2302px)] xl:px-10 xl:pb-[170px]"
    >
      <div className="mx-auto md:sticky md:top-0 md:h-screen md:max-w-[1440px]">
        <div className="hidden h-full min-h-[491px] items-center gap-[100px] md:flex xl:min-h-[680px] xl:gap-[200px]">
          <motion.div
            style={{ opacity: reduceMotion ? 1 : introOpacity }}
            className="relative z-10 w-[429px] shrink-0"
          >
            {eyebrow?.trim() ? (
              <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#7e796a]">
                {eyebrow.trim()}
              </p>
            ) : null}
            {title?.trim() ? (
              <h2 className="mt-4 font-display text-5xl font-medium leading-[1.08] text-[#1f1f1b] xl:text-6xl">
                {title.trim()}
              </h2>
            ) : null}
            {subtitle?.trim() ? (
              <p className="mt-5 max-w-sm text-lg font-medium leading-relaxed text-[#7e796a]">
                {subtitle.trim()}
              </p>
            ) : null}
            {ctaLabel?.trim() ? (
              <Link
                href={safeZaroHref(ctaHref, "/product")}
                className="group mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#1f1f1b] px-7 text-sm font-medium text-white transition-colors hover:bg-[#ffc400] hover:text-[#1f1f1b]"
              >
                {ctaLabel.trim()}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : null}
          </motion.div>

          <motion.div
            style={{
              x: reduceMotion ? 0 : stripX,
              y: "-50%",
            }}
            className="absolute right-0 top-1/2 flex w-max justify-end gap-12"
          >
            {visible.map((category, index) => (
              <CollectionCard
                key={category._id}
                category={category}
                index={index}
              />
            ))}
          </motion.div>

          <div className="absolute inset-x-0 bottom-10 h-0.5 overflow-hidden bg-[#1f1f1b]/20">
            <motion.div
              style={{ scaleX: reduceMotion ? 1 : progressScale }}
              className="h-full origin-left bg-[#1f1f1b]"
            />
          </div>
        </div>

        <div className="md:hidden">
          <div className="mb-8">
            {eyebrow?.trim() ? (
              <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#7e796a]">
                {eyebrow.trim()}
              </p>
            ) : null}
            {title?.trim() ? (
              <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-[#1f1f1b]">
                {title.trim()}
              </h2>
            ) : null}
            {subtitle?.trim() ? (
              <p className="mt-4 text-base font-medium leading-relaxed text-[#7e796a]">
                {subtitle.trim()}
              </p>
            ) : null}
          </div>
          <div className="space-y-6">
            {visible.map((category, index) => (
              <CollectionCard
                key={category._id}
                category={category}
                index={index}
                mobile
              />
            ))}
          </div>
          {ctaLabel?.trim() ? (
            <Link
              href={safeZaroHref(ctaHref, "/product")}
              className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#1f1f1b] px-7 text-sm font-medium text-white"
            >
              {ctaLabel.trim()}
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
