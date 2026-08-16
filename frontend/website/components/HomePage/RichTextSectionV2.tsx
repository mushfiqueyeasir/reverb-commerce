"use client";

import { useId, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Layers,
  Scissors,
  Shirt,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  parseHomepageStoryConfig,
  type StoryCardIcon,
} from "@/lib/cms/homepageStory";
import { V2Aurora, V2Grid, V2Particles, V2Reveal } from "./V2Motion";

export interface RichTextSectionV2Props {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  config?: Record<string, unknown>;
  imageUrl?: string | null;
  preview?: boolean;
}

const STORY_ICONS = {
  layers: Layers,
  shirt: Shirt,
  scissors: Scissors,
  zap: Zap,
  sparkles: Sparkles,
  award: Award,
} satisfies Record<StoryCardIcon, typeof Layers>;

function configString(
  config: Record<string, unknown> | undefined,
  key: string,
) {
  const value = config?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function plainText(value: string): string {
  return value
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

export default function RichTextSectionV2({
  title,
  subtitle,
  body,
  eyebrow,
  ctaLabel,
  ctaHref,
  config,
  imageUrl,
  preview = false,
}: RichTextSectionV2Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingId = useId();
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const outlineX = useTransform(scrollYProgress, [0, 1], [-32, 32]);
  const imageY = useTransform(scrollYProgress, [0, 1], [18, -18]);
  const copyY = useTransform(scrollYProgress, [0, 1], [-8, 8]);

  const heading = title?.trim();
  const supportingText = subtitle?.trim();
  const content = body?.trim();

  if (!heading && !supportingText && !content) return null;

  const story = parseHomepageStoryConfig(config);
  const overline =
    eyebrow?.trim() || configString(config, "eyebrow") || "Our manifesto";
  const linkLabel = ctaLabel?.trim() || configString(config, "cta_label");
  const linkHref =
    ctaHref?.trim() || configString(config, "cta_url") || "/product";
  const outlineWord = heading ? plainText(heading) : "";
  const monogram = outlineWord
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-background py-24 sm:py-32 lg:py-44"
      aria-labelledby={headingId}
    >
      {!heading ? (
        <h2 id={headingId} className="sr-only">
          {overline}
        </h2>
      ) : null}
      <V2Aurora className="-z-20 opacity-30" />
      <V2Grid className="-z-10 opacity-[0.08]" />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[linear-gradient(to_bottom,transparent,rgb(var(--v2-primary-rgb)/0.8),transparent)] shadow-[0_0_48px_12px_rgb(var(--v2-primary-rgb)/0.16)] sm:right-6 lg:right-10"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute right-[3vw] top-24 z-0 hidden aspect-square w-[min(34vw,34rem)] lg:block"
        aria-hidden="true"
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(var(--v2-primary-rgb)/0.22)_0%,rgb(var(--v2-primary-rgb)/0.06)_34%,transparent_70%)] blur-2xl" />
        <V2Particles className="rounded-full opacity-55 [mask-image:radial-gradient(circle,black_0%,black_58%,transparent_76%)]" />
        <motion.div
          className="absolute inset-[8%] rounded-full border border-primary/30"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute left-1/2 top-0 h-7 w-px -translate-x-1/2 -translate-y-1/2 bg-primary shadow-[0_0_20px_rgb(var(--v2-primary-rgb)/0.8)]" />
          <span className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 border border-primary bg-background" />
        </motion.div>
        <motion.div
          className="absolute inset-[20%] rounded-full border border-dashed border-foreground/20"
          animate={reduceMotion ? undefined : { rotate: -360 }}
          transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-[31%] grid place-items-center rounded-full border border-border bg-background/65 shadow-[inset_0_0_50px_rgb(var(--v2-primary-rgb)/0.14),0_0_70px_rgb(var(--v2-primary-rgb)/0.16)] backdrop-blur-md">
          <span className="font-display text-[clamp(3rem,7vw,7rem)] font-bold tracking-[-0.08em] text-foreground">
            {monogram || "V2"}
          </span>
        </div>
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 translate-x-1/3 flex-col items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-14 w-px bg-gradient-to-b from-transparent via-primary to-transparent" />
          <span className="[writing-mode:vertical-rl]">Perspective / 02</span>
        </div>
      </div>

      {outlineWord ? (
        <motion.div
          className="pointer-events-none absolute left-[-4vw] top-[12%] -z-10 select-none whitespace-nowrap font-display text-[clamp(7rem,23vw,23rem)] font-bold uppercase leading-[0.72] tracking-[-0.09em] text-transparent opacity-20 [-webkit-text-stroke:1px_rgb(var(--v2-foreground-rgb)/0.55)]"
          style={reduceMotion ? undefined : { x: outlineX }}
          aria-hidden="true"
        >
          {outlineWord}
        </motion.div>
      ) : null}

      <div className="relative z-10 mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10">
        <div className="grid grid-cols-12 items-start gap-x-4 sm:gap-x-6 lg:gap-x-8">
          <V2Reveal
            className="col-span-9 sm:col-span-5 lg:col-span-3"
            initiallyVisible={preview}
          >
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-[11px]">
              <span className="h-px w-10 bg-primary" aria-hidden="true" />
              {overline}
            </div>
          </V2Reveal>
          <V2Reveal
            className="col-span-3 hidden justify-self-end sm:block lg:col-span-2 lg:col-start-11"
            delay={0.08}
            initiallyVisible={preview}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Est. / Now
            </span>
          </V2Reveal>

          {heading ? (
            <V2Reveal
              className="col-span-12 mt-10 sm:col-span-11 sm:col-start-2 sm:mt-14 lg:col-span-10 lg:col-start-2 lg:mt-16"
              y={36}
              initiallyVisible={preview}
            >
              <h2
                id={headingId}
                className="max-w-[14ch] text-balance font-display text-[clamp(3.75rem,10.4vw,10.5rem)] font-bold leading-[0.78] tracking-[-0.075em] text-foreground"
              >
                {heading}
              </h2>
            </V2Reveal>
          ) : null}

          <motion.div
            className="relative col-span-11 -ml-5 mt-14 sm:col-span-8 sm:-ml-6 sm:mt-20 lg:col-span-7 lg:-ml-10 lg:mt-24"
            style={reduceMotion ? undefined : { y: imageY }}
          >
            <V2Reveal y={42} initiallyVisible={preview}>
              <figure className="relative aspect-[5/4] overflow-hidden border-y border-r border-border bg-surface sm:aspect-[4/5] lg:aspect-[16/10]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={
                      story.imageAlt ||
                      (heading ? `${heading} editorial` : "Story image")
                    }
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 66vw, 58vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgb(var(--v2-primary-rgb)/0.38),transparent_32%),linear-gradient(135deg,var(--card),var(--surface)_55%,var(--background))]">
                    <V2Grid className="opacity-40 [mask-image:linear-gradient(135deg,black,transparent_80%)]" />
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-[linear-gradient(115deg,rgb(var(--v2-background-rgb)/0.45),transparent_52%,rgb(var(--v2-primary-rgb)/0.12))]"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-y-0 right-0 w-px bg-[linear-gradient(to_bottom,transparent,rgb(var(--v2-primary-rgb)/0.9),transparent)] shadow-[0_0_36px_8px_rgb(var(--v2-primary-rgb)/0.28)]"
                  aria-hidden="true"
                />
                {story.imageLabel ||
                story.imageValue ||
                story.imageTag ||
                outlineWord ? (
                  <figcaption className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-foreground/80 sm:bottom-7 sm:left-7 sm:right-7">
                    <span className="min-w-0">
                      <span className="block font-mono text-[9px] uppercase tracking-[0.3em] sm:text-[10px]">
                        {story.imageLabel || outlineWord}
                      </span>
                      {story.imageValue ? (
                        <span className="mt-1 block truncate font-display text-lg font-semibold normal-case tracking-normal">
                          {story.imageValue}
                        </span>
                      ) : null}
                    </span>
                    {story.imageTag ? (
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-primary-readable sm:text-[10px]">
                        {story.imageTag}
                      </span>
                    ) : null}
                  </figcaption>
                ) : null}
              </figure>
            </V2Reveal>
          </motion.div>

          <motion.div
            className="col-span-11 col-start-2 mt-14 sm:col-span-7 sm:col-start-6 sm:-mt-28 lg:col-span-5 lg:col-start-8 lg:-mt-20"
            style={reduceMotion ? undefined : { y: copyY }}
          >
            <V2Reveal delay={0.1} initiallyVisible={preview}>
              <div className="border-t border-foreground/30 pt-6 sm:bg-background/80 sm:p-8 sm:backdrop-blur-md lg:p-10">
                <div className="mb-8 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[10px]">
                  <span>{story.copyLabel || "Point of view"}</span>
                  <span className="size-2 bg-primary" aria-hidden="true" />
                </div>

                {supportingText ? (
                  <p className="text-balance font-display text-2xl font-semibold leading-[1.12] tracking-[-0.035em] text-foreground sm:text-3xl lg:text-4xl">
                    {supportingText}
                  </p>
                ) : null}

                {content ? (
                  <div
                    className={`space-y-5 text-sm leading-7 text-muted-foreground [&_a]:text-primary-readable [&_a]:underline [&_h1]:text-2xl [&_h1]:text-foreground [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 sm:text-base sm:leading-8 ${supportingText ? "mt-8" : ""}`}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : null}

                {story.cards.length ? (
                  <div className="mt-10">
                    <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                      <span>{story.cardsLabel || "Highlights"}</span>
                      <span>
                        {String(story.cards.length).padStart(2, "0")} items
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {story.cards.map((card, index) => {
                        const Icon = STORY_ICONS[card.icon];
                        return (
                          <motion.div
                            key={card.id}
                            className="group relative overflow-hidden border border-border bg-transparent p-4 transition-colors hover:border-primary/55 hover:bg-primary/5"
                            whileHover={
                              reduceMotion ? undefined : { y: -4, scale: 1.015 }
                            }
                            transition={{
                              duration: 0.25,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <Icon
                                className="size-4 text-primary-readable transition-transform duration-300 group-hover:scale-110"
                                aria-hidden="true"
                              />
                              <span className="font-mono text-[8px] tracking-[0.2em] text-muted-foreground">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <p className="mt-5 font-display text-base font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-lg">
                              {card.label}
                            </p>
                            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                              {card.detail}
                            </p>
                            <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {linkLabel ? (
                  <Link
                    href={linkHref}
                    className="group mt-9 inline-flex min-h-12 items-center gap-4 border-b border-foreground pb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:border-primary hover:text-primary-readable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                  >
                    {linkLabel}
                    <span className="grid size-9 place-items-center bg-primary text-primary-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </Link>
                ) : null}
              </div>
            </V2Reveal>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
