"use client";

import type { KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { ArrowUpRight, ImageIcon, Quote, Star } from "lucide-react";
import type { TransformedReview } from "@/type/reviewType";
import { V2Aurora, V2Grid, V2Reveal } from "./V2Motion";

export interface ReviewsV2Props {
  reviews: TransformedReview[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
}

export default function ReviewsV2({
  reviews,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/reviews",
}: ReviewsV2Props) {
  const reduceMotion = useReducedMotion();
  const instanceId = useId();
  const panelId = `${instanceId}-panel`;
  const [selectedId, setSelectedId] = useState(() => reviews[0]?.id ?? "");
  const selectorRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = reviews.findIndex((review) => review.id === selectedId);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const active = reviews[activeIndex];

  if (!active) return null;

  const activeImage = active.image?.trim();
  const activeName = active.customerName?.trim() || "Verified customer";
  const activeCopy =
    active.body?.trim() ||
    (activeImage
      ? "A community look, shared from their point of view."
      : "A note from a member of our community.");
  const rating = Math.min(5, Math.max(0, active.rating ?? 5));
  const filledStars = Math.floor(rating);

  const selectReview = (index: number) => {
    const nextIndex = (index + reviews.length) % reviews.length;
    setSelectedId(reviews[nextIndex].id);
    selectorRefs.current[nextIndex]?.focus();
  };

  const handleSelectorKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = index + 1;
    if (event.key === "ArrowLeft") nextIndex = index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = reviews.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      selectReview(nextIndex);
    }
  };

  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-28 lg:py-36">
      <V2Aurora className="opacity-60" />
      <V2Grid className="opacity-[0.07]" />
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10">
        <V2Reveal className="mb-10 grid gap-7 sm:mb-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-primary sm:text-[11px]">
              <span className="h-px w-10 bg-primary" aria-hidden="true" />
              {eyebrow || "Community screening"}
            </p>
            <h2 className="max-w-5xl font-display text-5xl font-bold leading-[0.86] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
              {title || "Real people. Full frame."}
            </h2>
            {subtitle ? (
              <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          {ctaLabel ? (
            <Link
              href={ctaHref}
              className="group inline-flex min-h-12 w-fit items-center gap-3 border-b border-primary pb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-[11px]"
            >
              {ctaLabel}
              <ArrowUpRight
                className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ) : null}
        </V2Reveal>

        <V2Reveal delay={0.1}>
          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_30px_100px_rgb(0_0_0/0.28)] sm:rounded-[2.5rem]">
            <div
              id={panelId}
              role="tabpanel"
              aria-labelledby={`${instanceId}-tab-${activeIndex}`}
              aria-live="polite"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  className="grid lg:grid-cols-[1.18fr_0.82fr]"
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, scale: 0.985, filter: "blur(10px)" }
                  }
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 1.01, filter: "blur(8px)" }
                  }
                  transition={{ duration: reduceMotion ? 0.01 : 0.48 }}
                >
                  <div className="relative min-h-[280px] overflow-hidden bg-surface sm:min-h-[360px] lg:min-h-full">
                    {activeImage ? (
                      <motion.div
                        className="absolute inset-0"
                        initial={reduceMotion ? false : { scale: 1.06 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: reduceMotion ? 0.01 : 0.9 }}
                      >
                        <Image
                          src={activeImage}
                          alt={
                            active.customerName?.trim()
                              ? `${active.customerName.trim()}'s community review`
                              : "Community review"
                          }
                          fill
                          priority={activeIndex === 0}
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          className="object-cover"
                        />
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 grid place-items-center overflow-hidden">
                        <V2Aurora className="opacity-90" />
                        <V2Grid className="opacity-20" />
                        <div className="relative flex size-36 items-center justify-center rounded-full border border-primary/30 bg-primary/10 sm:size-52">
                          <Quote
                            className="size-16 text-primary sm:size-24"
                            strokeWidth={0.9}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, rgb(var(--v2-background-rgb) / 0.05), rgb(var(--v2-background-rgb) / 0.76))",
                      }}
                      aria-hidden="true"
                    />
                    <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.24em] text-foreground sm:inset-x-8 sm:top-8 sm:text-[10px]">
                      <span>
                        Frame {String(activeIndex + 1).padStart(2, "0")} /{" "}
                        {String(reviews.length).padStart(2, "0")}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        {activeImage ? (
                          <ImageIcon className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Quote className="size-3.5" aria-hidden="true" />
                        )}
                        {activeImage ? "Photo story" : "Text story"}
                      </span>
                    </div>
                  </div>

                  <figure className="relative flex min-h-[340px] flex-col justify-between border-t border-border bg-card p-7 sm:min-h-[360px] sm:p-10 lg:min-h-[650px] lg:border-l lg:border-t-0 lg:p-12 xl:p-16">
                    <div
                      className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"
                      aria-hidden="true"
                    />
                    <Quote
                      className="relative size-10 text-primary sm:size-14"
                      strokeWidth={1}
                      aria-hidden="true"
                    />
                    <div className="relative py-8 lg:py-12">
                      <blockquote className="font-display text-3xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-4xl xl:text-5xl">
                        “{activeCopy}”
                      </blockquote>
                    </div>
                    <figcaption className="relative flex flex-wrap items-end justify-between gap-5 border-t border-border pt-6">
                      <div>
                        <p className="font-display text-lg font-semibold sm:text-xl">
                          {activeName}
                        </p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground sm:text-[10px]">
                          Community member
                        </p>
                      </div>
                      <div>
                        <div
                          className="flex gap-1 text-primary"
                          aria-label={`${rating.toFixed(1)} out of 5 stars`}
                        >
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`size-4 ${index < filledStars ? "fill-primary" : "text-border"}`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-right font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                          {rating.toFixed(1)} / 5
                        </p>
                      </div>
                    </figcaption>
                  </figure>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="border-t border-border bg-surface/70 p-3 sm:p-4">
              <LayoutGroup id={instanceId}>
                <div
                  role="tablist"
                  aria-label="Select a community review"
                  className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]"
                >
                  {reviews.map((review, index) => {
                    const isSelected = index === activeIndex;
                    const image = review.image?.trim();
                    const name =
                      review.customerName?.trim() || `Community ${index + 1}`;
                    const reviewRating = Math.min(
                      5,
                      Math.max(0, review.rating ?? 5),
                    );

                    return (
                      <motion.button
                        key={`${review.id}-${index}`}
                        ref={(element) => {
                          selectorRefs.current[index] = element;
                        }}
                        id={`${instanceId}-tab-${index}`}
                        type="button"
                        data-preview-interactive
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={panelId}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => setSelectedId(review.id)}
                        onKeyDown={(event) =>
                          handleSelectorKeyDown(event, index)
                        }
                        className={`group relative flex min-h-20 w-[min(76vw,18rem)] shrink-0 snap-center items-center gap-3 overflow-hidden rounded-2xl border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-64 ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                        whileHover={reduceMotion ? undefined : { y: -3 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                      >
                        <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                          {image ? (
                            <Image
                              src={image}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <span className="grid size-full place-items-center bg-primary/10 text-primary">
                              <Quote
                                className="size-6"
                                strokeWidth={1.2}
                                aria-hidden="true"
                              />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-sm font-semibold text-foreground">
                            {name}
                          </span>
                          <span className="mt-1 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                            <span>{image ? "View frame" : "Read note"}</span>
                            <span>{reviewRating.toFixed(1)}</span>
                          </span>
                        </span>
                        {isSelected ? (
                          <motion.span
                            layoutId="review-selector"
                            className="absolute inset-x-3 bottom-0 h-0.5 bg-primary"
                            transition={{ duration: reduceMotion ? 0.01 : 0.3 }}
                            aria-hidden="true"
                          />
                        ) : null}
                      </motion.button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>
          </div>
        </V2Reveal>
      </div>
    </section>
  );
}
