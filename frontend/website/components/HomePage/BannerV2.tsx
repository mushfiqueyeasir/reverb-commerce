"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Banner } from "@/utility/getBanners";
import {
  V2Aurora,
  V2Grid,
  V2Particles,
  V2Reveal,
} from "@/components/HomePage/V2Motion";

export interface BannerV2Props {
  banners: Banner[];
  description?: string | null;
  headingLevel?: "h1" | "h2";
}

const ROTATION_INTERVAL = 7000;

export default function BannerV2({
  banners,
  description,
  headingLevel = "h1",
}: BannerV2Props) {
  const slides = banners.filter((banner) => Boolean(banner.title?.trim()));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const initialRender = useRef(true);
  const shouldReduceMotion = Boolean(useReducedMotion());
  const activeIndex = Math.min(index, Math.max(slides.length - 1, 0));
  const activeBanner = slides[activeIndex];
  const hasMultipleSlides = slides.length > 1;
  const interacting = hovered || focusWithin;
  const isAutoPlaying =
    hasMultipleSlides && !paused && !interacting && !shouldReduceMotion;
  const blurb =
    description?.trim() ||
    "Thoughtful essentials, selected to bring lasting value to everyday life.";

  const selectSlide = useCallback(
    (nextIndex: number) => {
      if (slides.length === 0) return;
      setIndex((nextIndex + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    initialRender.current = false;
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, ROTATION_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [isAutoPlaying, activeIndex, slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  if (!activeBanner) return null;

  const title = activeBanner.title?.trim();
  if (!title) return null;

  const subtitle = activeBanner.subtitle?.trim() || "Selected collection";
  const ctaLabel = activeBanner.ctaLabel?.trim() || "Explore collection";
  const ctaHref = activeBanner.ctaUrl?.trim() || "/product";
  const desktopImage = activeBanner.imageUrl || activeBanner.mobileImageUrl;
  const mobileImage = activeBanner.mobileImageUrl || activeBanner.imageUrl;
  const desktopSrcSet = desktopImage
    ? getImageProps({
        src: desktopImage,
        alt: "",
        fill: true,
        sizes: "100vw",
      }).props.srcSet
    : undefined;
  const Heading = headingLevel;
  const currentSlide = String(activeIndex + 1).padStart(2, "0");
  const totalSlides = String(slides.length).padStart(2, "0");

  return (
    <section
      className="relative isolate h-[86svh] min-h-[560px] max-h-[900px] w-full overflow-hidden bg-background text-foreground sm:min-h-[620px] lg:h-[92svh] lg:min-h-[680px] lg:max-h-[980px]"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setFocusWithin(false);
        }
      }}
    >
      <p
        className="sr-only"
        aria-live={isAutoPlaying ? "off" : "polite"}
        aria-atomic="true"
      >
        {`Slide ${activeIndex + 1} of ${slides.length}: ${title}`}
      </p>

      <div className="absolute inset-0 bg-surface" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div
            key={activeBanner.id}
            className="absolute inset-0 will-change-transform"
            initial={
              initialRender.current
                ? { opacity: 1, scale: shouldReduceMotion ? 1 : 1.025 }
                : shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.025 }
            }
            animate={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1.09 }
            }
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: shouldReduceMotion ? 0 : 0.9 },
              scale: { duration: 9, ease: "linear" },
            }}
          >
            {mobileImage || desktopImage ? (
              <picture>
                {desktopSrcSet ? (
                  <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
                ) : null}
                <Image
                  src={mobileImage || desktopImage!}
                  alt=""
                  fill
                  fetchPriority={activeIndex === 0 ? "high" : "auto"}
                  sizes="100vw"
                  className="object-cover"
                />
              </picture>
            ) : null}
            {!mobileImage && !desktopImage ? (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgb(var(--v2-primary-rgb)/0.42),transparent_38%),linear-gradient(135deg,var(--surface),var(--background))]" />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-background via-background/70 to-background/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background via-background/20 to-background/25 lg:via-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-44 bg-gradient-to-b from-background/55 to-transparent"
        aria-hidden="true"
      />
      <V2Aurora className="z-[2] opacity-35" />
      <V2Grid className="z-[3] opacity-[0.16]" />
      <V2Particles className="z-[3] opacity-55" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1800px] flex-col px-5 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10 lg:px-12 lg:pb-10 lg:pt-12 xl:px-16">
        <div className="flex items-start justify-between gap-6 border-t border-foreground/25 pt-4 font-mono text-[9px] uppercase tracking-[0.28em] text-foreground/70 sm:text-[10px]">
          <span>Campaign / Featured</span>
          <span className="max-w-[45%] text-right">{subtitle}</span>
        </div>

        <div className="flex min-h-0 flex-1 items-end pb-7 sm:pb-10 lg:items-center lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeBanner.id}
              className="relative w-full max-w-[980px] border-l border-primary/70 pl-5 sm:pl-8 lg:ml-[7vw] lg:w-[72%] lg:pl-10"
              role="group"
              aria-roledescription="slide"
              aria-label={`${activeIndex + 1} of ${slides.length}`}
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <V2Reveal delay={0.05} y={18} initiallyVisible>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-primary sm:mb-5 sm:text-[11px]">
                  Designed for the everyday
                </p>
              </V2Reveal>
              <V2Reveal delay={0.12} y={30} initiallyVisible>
                <Heading className="max-w-[11ch] text-balance font-display text-[clamp(3.2rem,13vw,6.8rem)] font-bold leading-[0.82] tracking-[-0.065em] text-foreground lg:text-[clamp(5.5rem,8.2vw,9.5rem)]">
                  {title}
                </Heading>
              </V2Reveal>
              <div className="mt-6 grid max-w-3xl gap-6 sm:mt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-10">
                <V2Reveal delay={0.2} y={22} initiallyVisible>
                  <p className="max-w-xl text-sm leading-6 text-foreground/75 sm:text-base sm:leading-7">
                    {blurb}
                  </p>
                </V2Reveal>
                <V2Reveal delay={0.28} y={18} initiallyVisible>
                  <Link
                    href={ctaHref}
                    className="group inline-flex min-h-12 w-fit items-center gap-4 border border-foreground bg-foreground px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 sm:text-[11px]"
                  >
                    {ctaLabel}
                    <ArrowUpRight
                      className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </V2Reveal>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-end gap-4 border-b border-foreground/25 pb-4 sm:gap-6 lg:ml-auto lg:w-[56%]">
          <div
            className="flex min-w-0 flex-1 items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-foreground/75"
            aria-label={`Slide ${activeIndex + 1} of ${slides.length}`}
          >
            <span className="text-foreground">{currentSlide}</span>
            <div className="relative h-px flex-1 overflow-hidden bg-foreground/25">
              <motion.span
                key={`${activeBanner.id}-${isAutoPlaying}`}
                className="absolute inset-0 origin-left bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isAutoPlaying ? 1 : 0 }}
                transition={{
                  duration: isAutoPlaying ? ROTATION_INTERVAL / 1000 : 0.2,
                  ease: "linear",
                }}
              />
            </div>
            <span>{totalSlides}</span>
          </div>

          {hasMultipleSlides ? (
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {!shouldReduceMotion ? (
                <button
                  type="button"
                  data-preview-interactive
                  onClick={() => setPaused((current) => !current)}
                  className="grid size-11 place-items-center border border-foreground/35 bg-background/20 text-foreground backdrop-blur-md transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                className="grid size-11 place-items-center border border-foreground/35 bg-background/20 text-foreground backdrop-blur-md transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Previous slide: ${slides[(activeIndex - 1 + slides.length) % slides.length]?.title?.trim() || "Previous collection"}`}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                data-preview-interactive
                onClick={() => selectSlide(activeIndex + 1)}
                className="grid size-11 place-items-center border border-foreground/35 bg-background/20 text-foreground backdrop-blur-md transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Next slide: ${slides[(activeIndex + 1) % slides.length]?.title?.trim() || "Next collection"}`}
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
