"use client";

import { useEffect, useId, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";
import type { Banner } from "@/utility/getBanners";

interface KawaiiFashionBannerProps {
  banners: Banner[];
  description?: string | null;
  editLabel?: string | null;
  footerNote?: string | null;
  imageBadge?: string | null;
  headingLevel?: "h1" | "h2";
}

const CAROUSEL_ROLE_DESCRIPTION = "carousel";
const CAROUSEL_ANNOUNCEMENT_TEMPLATE = "Slide {current} of {total}: {title}";
const PAUSE_LABEL = "Pause slide rotation";
const RESUME_LABEL = "Resume slide rotation";
const PREVIOUS_LABEL = "Previous collection";
const NEXT_LABEL = "Next collection";

const ROTATION_INTERVAL = 7000;

function announcement(
  template: string,
  current: number,
  total: number,
  title: string,
) {
  return template
    .replaceAll("{current}", String(current))
    .replaceAll("{total}", String(total))
    .replaceAll("{title}", title);
}

export default function KawaiiFashionBanner({
  banners,
  description,
  editLabel,
  footerNote,
  imageBadge,
  headingLevel = "h1",
}: KawaiiFashionBannerProps) {
  const slides = banners.filter((banner) => banner.title?.trim());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());
  const labelId = useId();
  const activeIndex = Math.min(index, Math.max(0, slides.length - 1));
  const active = slides[activeIndex];
  const hasMultiple = slides.length > 1;
  const isPlaying =
    hasMultiple && !paused && !interacting && !dragging && !reduceMotion;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, ROTATION_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPlaying, slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  if (!active) return null;

  const Heading = headingLevel;
  const title = active.title?.trim();
  if (!title) return null;
  const subtitle = active.subtitle?.trim();
  const blurb = description?.trim();
  const href = safeKawaiiHref(active.ctaUrl, "/product");
  const ctaLabel = active.ctaLabel?.trim();
  const normalizedEditLabel = editLabel?.trim();
  const normalizedFooterNote = footerNote?.trim();
  const normalizedImageBadge = imageBadge?.trim();
  const hasRotationControl = Boolean(PAUSE_LABEL && RESUME_LABEL);
  const hasControls = Boolean(
    hasRotationControl || PREVIOUS_LABEL || NEXT_LABEL,
  );
  const desktopImage = active.imageUrl || active.mobileImageUrl;
  const mobileImage = active.mobileImageUrl || active.imageUrl;
  const desktopSrcSet = desktopImage
    ? getImageProps({
        src: desktopImage,
        alt: "",
        fill: true,
        sizes: "(min-width: 1024px) 52vw, 100vw",
      }).props.srcSet
    : undefined;

  const selectSlide = (next: number) => {
    setIndex((next + slides.length) % slides.length);
  };

  const selectSwipeSlide = (offset: number, velocity: number) => {
    const projected = offset + velocity * 0.18;
    if (projected > 72) selectSlide(activeIndex - 1);
    if (projected < -72) selectSlide(activeIndex + 1);
  };

  return (
    <section
      className="relative isolate overflow-hidden bg-background px-4 pb-2 pt-6 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10"
      aria-roledescription={CAROUSEL_ROLE_DESCRIPTION}
      aria-labelledby={normalizedEditLabel ? labelId : undefined}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setInteracting(false);
        }
      }}
    >
      {CAROUSEL_ANNOUNCEMENT_TEMPLATE ? (
        <p className="sr-only" aria-live={isPlaying ? "off" : "polite"}>
          {announcement(
            CAROUSEL_ANNOUNCEMENT_TEMPLATE,
            activeIndex + 1,
            slides.length,
            title,
          )}
        </p>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(circle_at_18%_16%,color-mix(in_srgb,var(--primary)_13%,transparent),transparent_38%)]" />
      <div className="relative mx-auto grid max-w-[1520px] overflow-hidden border border-border bg-surface lg:min-h-[720px] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="relative z-10 order-2 flex flex-col justify-between px-5 py-6 sm:px-10 sm:py-10 lg:order-1 lg:px-14 lg:py-14 xl:px-20">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground sm:text-[11px]">
            {normalizedEditLabel ? (
              <span id={labelId}>{normalizedEditLabel}</span>
            ) : null}
            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          </div>
          <div className="py-8 sm:py-12 lg:py-16">
            {subtitle ? (
              <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-readable">
                <span
                  className="size-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                {subtitle}
              </p>
            ) : null}
            <Heading className="max-w-[11ch] text-balance font-display text-[clamp(2.75rem,12vw,6.7rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
              {title}
            </Heading>
            {blurb ? (
              <p className="mt-6 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                {blurb}
              </p>
            ) : null}
            {ctaLabel ? (
              <Link
                href={href}
                className="group mt-8 inline-flex min-h-12 items-center gap-4 bg-primary px-6 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface motion-reduce:transition-none"
              >
                {ctaLabel}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>
          {normalizedFooterNote ? (
            <p className="max-w-sm border-t border-border pt-4 text-[10px] font-medium uppercase leading-5 tracking-[0.2em] text-muted-foreground">
              {normalizedFooterNote}
            </p>
          ) : null}
        </div>

        <motion.div
          className="relative order-1 min-h-[360px] cursor-grab overflow-hidden bg-card active:cursor-grabbing sm:min-h-[480px] lg:order-2 lg:min-h-full"
          drag={hasMultiple && !reduceMotion ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.35}
          dragMomentum={false}
          dragTransition={{ bounceStiffness: 220, bounceDamping: 24 }}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_, info) => {
            setDragging(false);
            selectSwipeSlide(info.offset.x, info.velocity.x);
          }}
          style={{ touchAction: "pan-y" }}
        >
          {mobileImage || desktopImage ? (
            <picture>
              {desktopSrcSet ? (
                <source media="(min-width: 1024px)" srcSet={desktopSrcSet} />
              ) : null}
              <Image
                key={active.id}
                src={mobileImage || desktopImage!}
                alt=""
                fill
                priority={activeIndex === 0}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover motion-safe:animate-[hero-in_500ms_ease-out]"
              />
            </picture>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_26%,color-mix(in_srgb,var(--primary)_25%,transparent),transparent_28%),linear-gradient(145deg,var(--card),var(--surface))]" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/30 to-transparent" />
          {normalizedImageBadge ? (
            <span className="absolute right-5 top-5 border border-background/65 bg-background/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground backdrop-blur-sm sm:right-8 sm:top-8">
              {normalizedImageBadge}
            </span>
          ) : null}
          {hasMultiple && hasControls ? (
            <div className="absolute bottom-5 right-5 flex items-center gap-2 sm:bottom-8 sm:right-8">
              {!reduceMotion && hasRotationControl ? (
                <button
                  type="button"
                  data-preview-interactive
                  onClick={() => setPaused((current) => !current)}
                  className="grid size-11 place-items-center border border-background/70 bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  aria-label={paused ? RESUME_LABEL : PAUSE_LABEL}
                  aria-pressed={paused}
                >
                  {paused ? (
                    <Play className="size-4" aria-hidden="true" />
                  ) : (
                    <Pause className="size-4" aria-hidden="true" />
                  )}
                </button>
              ) : null}
              {PREVIOUS_LABEL ? (
                <button
                  type="button"
                  data-preview-interactive
                  onClick={() => selectSlide(activeIndex - 1)}
                  className="grid size-11 place-items-center border border-background/70 bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  aria-label={PREVIOUS_LABEL}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
              ) : null}
              {NEXT_LABEL ? (
                <button
                  type="button"
                  data-preview-interactive
                  onClick={() => selectSlide(activeIndex + 1)}
                  className="grid size-11 place-items-center border border-background/70 bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  aria-label={NEXT_LABEL}
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
