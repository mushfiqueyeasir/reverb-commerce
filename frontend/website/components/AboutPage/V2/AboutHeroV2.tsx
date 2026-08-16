"use client";

import { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { V2Grid, V2Reveal } from "@/components/HomePage/V2Motion";
import { configString, type AboutV2ImageProps } from "./aboutV2Config";

export interface AboutHeroV2Props extends AboutV2ImageProps {
  headingLevel?: "h1" | "h2";
}

export default function AboutHeroV2({
  config,
  imageUrl,
  preview = false,
  headingLevel = "h1",
}: AboutHeroV2Props) {
  const headingId = useId();
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const eyebrow = configString(config, "eyebrow");
  const firstLine = configString(config, "headline_line1");
  const secondLine = configString(config, "headline_line2");
  const subtitle = configString(config, "subtitle");
  const primaryLabel = configString(config, "cta_primary_label");
  const primaryHref = configString(config, "cta_primary_url") || "/product";
  const secondaryLabel = configString(config, "cta_secondary_label");
  const secondaryHref =
    configString(config, "cta_secondary_url") || "/contact-us";
  const Heading = headingLevel;

  if (
    !eyebrow &&
    !firstLine &&
    !secondLine &&
    !subtitle &&
    !primaryLabel &&
    !secondaryLabel
  ) {
    return null;
  }

  return (
    <section
      className="relative isolate min-h-[760px] overflow-hidden bg-background text-foreground motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:min-h-[820px] lg:min-h-[900px]"
      aria-labelledby={headingId}
    >
      <div className="absolute inset-0 bg-surface" aria-hidden="true">
        {imageUrl ? (
          <motion.div
            className="absolute inset-y-0 right-0 w-full lg:w-[63%]"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.035 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: reduceMotion ? 0.01 : 1.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Image
              src={imageUrl}
              alt=""
              fill
              priority={!preview}
              sizes="(max-width: 1024px) 100vw, 64vw"
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-y-0 right-0 w-full bg-[radial-gradient(circle_at_72%_24%,rgb(var(--v2-primary-rgb)/0.42),transparent_35%),linear-gradient(145deg,var(--surface),var(--card)_58%,var(--background))] lg:w-[63%]" />
        )}
      </div>
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,rgb(var(--v2-background-rgb)/0.98)_36%,rgb(var(--v2-background-rgb)/0.56)_68%,rgb(var(--v2-background-rgb)/0.12)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/35"
        aria-hidden="true"
      />
      <V2Grid className="opacity-[0.08] [mask-image:linear-gradient(to_right,black,transparent_72%)]" />

      <div className="relative mx-auto flex min-h-[760px] max-w-[1800px] flex-col px-5 pb-7 pt-8 sm:min-h-[820px] sm:px-8 sm:pb-9 sm:pt-10 lg:min-h-[900px] lg:px-12 lg:pb-12 xl:px-16">
        <div className="flex items-start justify-between gap-6 border-t border-foreground/25 pt-4 font-mono text-[9px] uppercase tracking-[0.28em] text-foreground/65 sm:text-[10px]">
          <span>{eyebrow || "About / Manifesto"}</span>
          <span className="hidden items-center gap-3 sm:flex">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_14px_rgb(var(--v2-primary-rgb)/0.9)]" />
            Purpose in every detail
          </span>
        </div>

        <div className="grid flex-1 items-end pb-12 pt-20 lg:grid-cols-12 lg:items-center lg:pb-6 lg:pt-12">
          <div className="lg:col-span-8 lg:col-start-2">
            {firstLine || secondLine ? (
              <V2Reveal y={38} initiallyVisible={preview}>
                <Heading
                  id={headingId}
                  className="max-w-[11ch] text-balance font-display text-[clamp(3.8rem,12vw,8.75rem)] font-bold leading-[0.78] tracking-[-0.075em]"
                >
                  {firstLine ? (
                    <span className="block">{firstLine}</span>
                  ) : null}
                  {secondLine ? (
                    <span className="block text-primary-readable">
                      {secondLine}
                    </span>
                  ) : null}
                </Heading>
              </V2Reveal>
            ) : (
              <Heading id={headingId} className="sr-only">
                {eyebrow || "About us"}
              </Heading>
            )}

            <div className="mt-9 grid max-w-4xl gap-8 border-l border-primary pl-5 sm:mt-12 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:pl-8 lg:ml-[8%]">
              {subtitle ? (
                <V2Reveal delay={0.12} y={22} initiallyVisible={preview}>
                  <p className="max-w-xl text-sm leading-7 text-foreground/75 sm:text-base sm:leading-8 lg:text-lg">
                    {subtitle}
                  </p>
                </V2Reveal>
              ) : (
                <span />
              )}
              {primaryLabel || secondaryLabel ? (
                <V2Reveal delay={0.2} y={18} initiallyVisible={preview}>
                  <div className="flex flex-wrap gap-3">
                    {primaryLabel ? (
                      <Link
                        href={primaryHref}
                        className="group inline-flex min-h-12 items-center gap-4 bg-foreground px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:px-6 sm:text-[11px]"
                      >
                        {primaryLabel}
                        <ArrowUpRight
                          className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Link>
                    ) : null}
                    {secondaryLabel ? (
                      <Link
                        href={secondaryHref}
                        className="inline-flex min-h-12 items-center border border-foreground/45 px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary-readable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:px-6 sm:text-[11px]"
                      >
                        {secondaryLabel}
                      </Link>
                    ) : null}
                  </div>
                </V2Reveal>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-5 border-b border-foreground/25 pb-4 font-mono text-[9px] uppercase tracking-[0.26em] text-foreground/60 sm:text-[10px]">
          <span>Independent perspective / V2</span>
          <span className="flex items-center gap-3 text-foreground">
            Continue
            <ArrowDownRight
              className="size-4 text-primary-readable"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </section>
  );
}
