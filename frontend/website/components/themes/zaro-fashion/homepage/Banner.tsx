"use client";

import { useEffect, useId, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { safeZaroHref } from "@/components/themes/zaro-fashion/safeHref";
import type { Banner } from "@/utility/getBanners";

interface ZaroBannerProps {
  banners: Banner[];
  description?: string | null;
  headingLevel?: "h1" | "h2";
  seenInLabel?: string | null;
}

const ROTATION_INTERVAL = 7000;

const SEEN_IN_LOGOS = [
  "/images/themes/zaro-fashion/logo-as-seen-1.svg",
  "/images/themes/zaro-fashion/logo-as-seen-2.svg",
  "/images/themes/zaro-fashion/logo-as-seen-3.svg",
  "/images/themes/zaro-fashion/logo-as-seen-4.svg",
];

export default function ZaroBanner({
  banners,
  description,
  headingLevel = "h1",
  seenInLabel = "As seen in",
}: ZaroBannerProps) {
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
  const subtitle = active.subtitle?.trim();
  const blurb = description?.trim();
  const href = safeZaroHref(active.ctaUrl, "/product");
  const ctaLabel = active.ctaLabel?.trim();
  const desktopImage = active.imageUrl || active.mobileImageUrl;
  const mobileImage = active.mobileImageUrl || active.imageUrl;
  const desktopSrcSet = desktopImage
    ? getImageProps({
        src: desktopImage,
        alt: "",
        fill: true,
        sizes: "(min-width: 1024px) 55vw, 100vw",
      }).props.srcSet
    : undefined;

  const selectSlide = (next: number) => {
    setIndex((next + slides.length) % slides.length);
  };

  return (
    <>
      <section
        className="relative isolate overflow-hidden bg-[#7e796a] text-white"
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

        <div className="relative flex min-h-[560px] items-center lg:min-h-[680px]">
          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-20 sm:px-10 lg:px-[40px]">
            <div className="max-w-[34rem]">
              {subtitle ? (
                <p className="mb-6 text-sm font-medium uppercase tracking-[0.18em] text-white/80">
                  {subtitle}
                </p>
              ) : null}
              <Heading
                id={labelId}
                className="max-w-[12ch] text-balance font-display text-[40px] font-bold uppercase leading-[1em] tracking-[-0.01em] text-white lg:text-[90px] lg:leading-[0.9em] xl:text-[135px] xl:leading-[0.87em]"
              >
                {title}
              </Heading>
              {blurb ? (
                <p className="mt-6 max-w-md text-lg font-medium leading-relaxed text-white/85">
                  {blurb}
                </p>
              ) : null}
              <div className="mt-10 flex flex-wrap items-center gap-6">
                {ctaLabel ? (
                  <Link
                    href={href}
                    className="group inline-flex min-h-12 items-center gap-4 rounded-full bg-white px-8 py-4 text-sm font-medium text-[#1f1f1b] transition-colors hover:bg-[#ffc400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#7e796a] motion-reduce:transition-none"
                  >
                    {ctaLabel}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {desktopImage || mobileImage ? (
            <motion.div
              className="absolute inset-y-0 right-0 w-full sm:w-[58%] lg:w-[61%]"
              initial={false}
              animate={{ x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
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
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-r from-[#7e796a] via-[#7e796a]/40 to-transparent sm:from-[#7e796a]" />
            </motion.div>
          ) : null}

          {hasMultiple ? (
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
              <button
                type="button"
                data-preview-interactive
                onClick={() => selectSlide(activeIndex - 1)}
                className="grid size-11 place-items-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#1f1f1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                data-preview-interactive
                onClick={() => {
                  if (hasMultiple) setPaused((current) => !current);
                }}
                className="grid size-11 place-items-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#1f1f1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
                aria-label={
                  paused ? "Resume slide rotation" : "Pause slide rotation"
                }
                aria-pressed={paused}
              >
                <span className="text-[11px] font-semibold tracking-[0.12em]">
                  {String(activeIndex + 1).padStart(2, "0")}/
                  {String(slides.length).padStart(2, "0")}
                </span>
              </button>
              <button
                type="button"
                data-preview-interactive
                onClick={() => selectSlide(activeIndex + 1)}
                className="grid size-11 place-items-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#1f1f1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
                aria-label="Next slide"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {seenInLabel ? (
        <section className="border-y border-[#dedad9] bg-[#f9f5f3] py-8">
          <p className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.24em] text-[#7e796a]">
            {seenInLabel}
          </p>
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 sm:px-10">
            {SEEN_IN_LOGOS.map((logo) => (
              <Image
                key={logo}
                src={logo}
                alt=""
                width={120}
                height={28}
                className="h-7 w-auto object-contain opacity-70"
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
