"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Banner } from "@/utility/getBanners";
import {
  DEFAULT_BANNER_DESCRIPTION,
  DEFAULT_BANNER_STATS,
  type BannerStatItem,
} from "@/type/db";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { renderBannerTitle } from "@/utility/renderBannerTitle";

interface HeroProps {
  banners: Banner[];
  description?: string | null;
  stats?: BannerStatItem[];
}

const PARTICLES = Array.from({ length: 18 });

export default function Hero({ banners, description, stats }: HeroProps) {
  const [index, setIndex] = useState(0);
  const reduceMotion = Boolean(useReducedMotion());
  const slides = banners.filter((b) => Boolean(b.title?.trim()));
  const count = slides.length;
  const multiple = count > 1;
  const banner = slides[index];
  const statItems = stats && stats.length > 0 ? stats : DEFAULT_BANNER_STATS;
  const blurb = description?.trim() || DEFAULT_BANNER_DESCRIPTION;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!count) return;
      setIndex((prev) => (prev + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!multiple || reduceMotion) return;
    const timer = setInterval(() => {
      setIndex((p) => (p + 1) % count);
    }, 7000);
    return () => clearInterval(timer);
  }, [multiple, count, reduceMotion]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (!banner) return null;

  const title = banner.title!.trim();
  const subtitle = banner.subtitle?.trim() || null;
  const ctaLabel = banner.ctaLabel?.trim() || "Shop collection";
  const ctaUrl = banner.ctaUrl?.trim() || "/product";

  return (
    <section className="relative isolate min-h-[100dvh] w-full overflow-x-hidden bg-background">
      {/* Grid + noise */}
      <div
        className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden
      />

      {/* Spotlight */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 h-[min(70vh,640px)] w-[min(70vh,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full md:h-[900px] md:w-[900px]",
          !reduceMotion && "animate-spotlight",
        )}
        style={{
          background:
            "radial-gradient(circle, rgb(var(--primary-rgb) / 0.22) 0%, rgb(var(--primary-rgb) / 0.06) 35%, transparent 65%)",
        }}
        aria-hidden
      />

      {/* Hero image — right column; overlaps left so the panel edge never shows as a seam */}
      <div className="absolute inset-y-0 right-0 w-full overflow-hidden md:left-[36%] md:w-auto">
        <div className="relative h-full w-full">
          {slides.map((slide, i) => {
            const desktopSrc = slide.imageUrl ?? slide.mobileImageUrl;
            const mobileSrc = slide.mobileImageUrl ?? slide.imageUrl;
            if (!desktopSrc && !mobileSrc) return null;
            const active = i === index;
            return (
              <div
                key={slide.id}
                className={cn(
                  "absolute inset-0",
                  !reduceMotion &&
                    "transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  active ? "z-[1] opacity-100" : "z-0 opacity-0",
                )}
                aria-hidden={!active}
              >
                {mobileSrc ? (
                  <Image
                    src={mobileSrc}
                    alt={slide.title?.trim() || "Banner slide"}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className={cn(
                      "object-cover object-center opacity-70 md:hidden",
                      !reduceMotion &&
                        "transition-transform duration-[7000ms] ease-out will-change-transform",
                      !reduceMotion && (active ? "scale-105" : "scale-[1.02]"),
                    )}
                  />
                ) : null}
                {desktopSrc ? (
                  <Image
                    src={desktopSrc}
                    alt={slide.title?.trim() || "Banner slide"}
                    fill
                    priority={i === 0}
                    sizes="64vw"
                    className={cn(
                      "hidden object-cover object-center md:block",
                      !reduceMotion &&
                        "transition-transform duration-[7000ms] ease-out will-change-transform",
                      !reduceMotion && (active ? "scale-105" : "scale-[1.02]"),
                    )}
                  />
                ) : null}
              </div>
            );
          })}
          {/* Soft edge fade — lighter on mobile (full-bleed), stronger on desktop split */}
          <div
            className="absolute inset-0 z-[2] hidden md:block"
            style={{
              background:
                "linear-gradient(90deg, var(--background) 0%, color-mix(in srgb, var(--background) 92%, transparent) 18%, color-mix(in srgb, var(--background) 55%, transparent) 38%, color-mix(in srgb, var(--background) 18%, transparent) 58%, transparent 78%)",
            }}
          />
          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-background via-background/20 to-transparent md:via-transparent" />
        </div>
      </div>

      {!reduceMotion ? (
        <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden>
          {PARTICLES.map((_, i) => (
            <span
              key={i}
              className="absolute bottom-0 h-1 w-1 animate-particle rounded-full bg-primary/60"
              style={{
                left: `${(i * 5.7) % 100}%`,
                animationDuration: `${8 + (i % 6) * 2}s`,
                animationDelay: `${-i * 0.7}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Content — copy + stats flow together; hero grows on short viewports instead of overlapping */}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1600px] flex-col px-5 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-24 md:px-10 md:pb-8 md:pt-28">
        <div className="mt-auto flex flex-col gap-6 sm:gap-8 md:gap-10">
          <div key={banner.id} className="max-w-3xl">
            {subtitle ? (
              <div
                className={cn(
                  "mb-3 inline-flex max-w-full items-center gap-2.5 truncate rounded-full border border-border bg-surface/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md sm:mb-4 sm:gap-3 sm:px-3.5 md:mb-6 md:px-4 md:py-1.5 md:text-[11px] md:tracking-[0.25em]",
                  !reduceMotion && "animate-hero-in",
                )}
                style={{ animationDelay: "0.05s" }}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full bg-primary",
                    !reduceMotion && "animate-pulse",
                  )}
                />
                <span className="truncate">{subtitle}</span>
              </div>
            ) : null}

            <h1
              className={cn(
                "font-display text-[clamp(2.35rem,9vw,5.75rem)] font-bold leading-[0.88] tracking-[-0.045em] text-foreground md:text-[clamp(3rem,8vw,6.5rem)]",
                !reduceMotion && "animate-hero-in",
              )}
              style={{ animationDelay: "0.12s" }}
            >
              {renderBannerTitle(title)}
            </h1>

            {blurb ? (
              <p
                className={cn(
                  "mt-3 line-clamp-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:line-clamp-none md:mt-6 md:text-base",
                  !reduceMotion && "animate-hero-in",
                )}
                style={{ animationDelay: "0.22s" }}
              >
                {blurb}
              </p>
            ) : null}

            <div
              className={cn(
                "mt-5 flex w-full flex-col gap-2.5 sm:mt-6 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center md:mt-8 md:gap-3",
                !reduceMotion && "animate-hero-in",
              )}
              style={{ animationDelay: "0.32s" }}
            >
              <Link
                href={ctaUrl}
                className="group relative inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-foreground px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-background transition-all hover:bg-primary hover:text-primary-foreground sm:h-auto sm:w-auto sm:justify-start sm:py-3 sm:hover:pl-7 sm:hover:pr-5 md:px-8 md:py-3.5 md:text-[13px]"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/product"
                className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-transparent px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-primary hover:text-primary-readable sm:h-auto sm:w-auto sm:justify-start sm:py-3 md:px-8 md:py-3.5 md:text-[13px]"
              >
                Explore New Drop
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-col gap-3 border-t border-border/80 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pt-4 sm:tracking-[0.22em] md:pt-5 md:text-[11px]",
              !reduceMotion && "animate-float-up",
            )}
            style={{ animationDelay: "0.45s" }}
          >
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4 md:gap-x-10">
              {statItems.map((s) => (
                <Stat key={`${s.label}-${s.value}`} k={s.label} v={s.value} />
              ))}
            </div>
            {multiple ? (
              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                <span className="tabular-nums text-foreground/80">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(count).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous slide"
                    className="grid size-11 place-items-center rounded-full border border-border transition hover:border-primary"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next slide"
                    className="grid size-11 place-items-center rounded-full border border-border transition hover:border-primary"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <span>Scroll</span>
                <span className="block h-6 w-px bg-border" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-muted-foreground/60">{k}</span>
      <span className="truncate text-foreground">{v}</span>
    </div>
  );
}
