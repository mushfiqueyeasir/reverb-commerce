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
import { useReducedMotion } from "motion/react";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";
import type { Banner } from "@/utility/getBanners";

interface KawaiiFashionBannerProps {
  banners: Banner[];
  description?: string | null;
  headingLevel?: "h1" | "h2";
}

const ROTATION_INTERVAL = 7000;

export default function KawaiiFashionBanner({
  banners,
  description,
  headingLevel = "h1",
}: KawaiiFashionBannerProps) {
  const slides = banners.filter((banner) => banner.title?.trim());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());
  const labelId = useId();
  const activeIndex = Math.min(index, Math.max(0, slides.length - 1));
  const active = slides[activeIndex];
  const hasMultiple = slides.length > 1;
  const isPlaying = hasMultiple && !paused && !interacting && !reduceMotion;

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
  const subtitle = active.subtitle?.trim() || "New season, softly styled";
  const blurb =
    description?.trim() ||
    "Fresh silhouettes, pretty details, and easy layers chosen for everyday dressing.";
  const href = safeKawaiiHref(active.ctaUrl, "/product");
  const ctaLabel = active.ctaLabel?.trim() || "Shop the collection";
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

  return (
    <section
      className="relative isolate overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setInteracting(false);
        }
      }}
    >
      <p className="sr-only" aria-live={isPlaying ? "off" : "polite"}>
        {`Slide ${activeIndex + 1} of ${slides.length}: ${title}`}
      </p>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(circle_at_18%_16%,color-mix(in_srgb,var(--primary)_13%,transparent),transparent_38%)]" />
      <div className="relative mx-auto grid max-w-[1500px] overflow-hidden border border-border bg-surface lg:min-h-[720px] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="relative z-10 flex flex-col justify-between px-5 py-6 sm:px-10 sm:py-10 lg:px-14 lg:py-14 xl:px-20">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground sm:text-[11px]">
            <span id={labelId}>Kawaii fashion edit</span>
            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          </div>
          <div className="py-8 sm:py-12 lg:py-16">
            <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              {subtitle}
            </p>
            <Heading className="max-w-[11ch] text-balance font-display text-[clamp(2.75rem,12vw,6.7rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
              {title}
            </Heading>
            <p className="mt-6 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
              {blurb}
            </p>
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
          </div>
          <p className="max-w-sm border-t border-border pt-4 text-[10px] font-medium uppercase leading-5 tracking-[0.2em] text-muted-foreground">
            Thoughtfully selected · Easy everyday styling
          </p>
        </div>

        <div className="relative min-h-[360px] overflow-hidden bg-card sm:min-h-[480px] lg:min-h-full">
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
          <span className="absolute right-5 top-5 border border-background/65 bg-background/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground backdrop-blur-sm sm:right-8 sm:top-8">
            The new mood
          </span>
          {hasMultiple ? (
            <div className="absolute bottom-5 right-5 flex items-center gap-2 sm:bottom-8 sm:right-8">
              {!reduceMotion ? (
                <button
                  type="button"
                  data-preview-interactive
                  onClick={() => setPaused((current) => !current)}
                  className="grid size-11 place-items-center border border-background/70 bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  aria-label={
                    paused ? "Resume slide rotation" : "Pause slide rotation"
                  }
                  aria-pressed={paused}
                >
                  {paused ? (
                    <Play className="size-4" aria-hidden="true" />
                  ) : (
                    <Pause className="size-4" aria-hidden="true" />
                  )}
                </button>
              ) : null}
              <button
                type="button"
                data-preview-interactive
                onClick={() => selectSlide(activeIndex - 1)}
                className="grid size-11 place-items-center border border-background/70 bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                aria-label="Previous collection"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                data-preview-interactive
                onClick={() => selectSlide(activeIndex + 1)}
                className="grid size-11 place-items-center border border-background/70 bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                aria-label="Next collection"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
