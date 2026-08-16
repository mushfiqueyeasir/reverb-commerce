"use client";

import { useId } from "react";
import Image from "next/image";
import {
  Award,
  Layers,
  Scissors,
  Shirt,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { V2Grid, V2Reveal } from "@/components/HomePage/V2Motion";
import {
  configString,
  parseCraft,
  type AboutV2ImageProps,
} from "./aboutV2Config";

const craftIcons: Record<string, LucideIcon> = {
  Award,
  Layers,
  Scissors,
  Shirt,
  Sparkles,
  Zap,
};

export type AboutCraftV2Props = AboutV2ImageProps;

export default function AboutCraftV2({
  config,
  imageUrl,
  preview = false,
}: AboutCraftV2Props) {
  const headingId = useId();
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const eyebrow = configString(config, "eyebrow");
  const firstLine = configString(config, "title_line1");
  const secondLine = configString(config, "title_line2");
  const body = configString(config, "body");
  const fabricLabel = configString(config, "fabric_label");
  const fabricValue = configString(config, "fabric_value");
  const fabricTag = configString(config, "fabric_tag");
  const items = parseCraft(config);
  const imageAlt =
    fabricValue || [firstLine, secondLine].filter(Boolean).join(" ");

  if (
    !eyebrow &&
    !firstLine &&
    !secondLine &&
    !body &&
    !fabricLabel &&
    !fabricValue &&
    !fabricTag &&
    items.length === 0 &&
    !imageUrl
  ) {
    return null;
  }

  return (
    <section
      className="relative isolate overflow-hidden bg-background py-24 text-foreground motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:py-32 lg:py-44"
      aria-labelledby={headingId}
    >
      <V2Grid className="-z-10 opacity-[0.09] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)]" />
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
        <V2Reveal
          className="mb-12 flex items-center justify-between gap-5 border-y border-border py-4 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground sm:mb-16 sm:text-[10px] lg:mb-20"
          initiallyVisible={preview}
        >
          <span className="flex items-center gap-3">
            <span className="size-2 border border-primary bg-primary/20" />
            {eyebrow || "Product standards"}
          </span>
          <span>
            Technical blueprint / {String(items.length).padStart(2, "0")}
          </span>
        </V2Reveal>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          <motion.figure
            className="relative min-h-[520px] overflow-hidden border border-border bg-surface sm:min-h-[680px] lg:col-span-7 lg:min-h-[780px]"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, clipPath: "inset(0 0 12% 0)" }
            }
            whileInView={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            viewport={{ once: true, amount: 0.14 }}
            transition={{
              duration: reduceMotion ? 0.01 : 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_62%_37%,rgb(var(--v2-primary-rgb)/0.24),transparent_28%),linear-gradient(145deg,var(--surface),var(--card),var(--background))]">
                <V2Grid className="opacity-30 [background-size:36px_36px]" />
                <div className="absolute left-1/2 top-1/2 aspect-square w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/35" />
                <div className="absolute left-1/2 top-1/2 aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-foreground/20" />
                <div className="absolute inset-x-[12%] top-1/2 h-px bg-primary/45" />
                <div className="absolute inset-y-[12%] left-1/2 w-px bg-primary/45" />
              </div>
            )}
            <div
              className="absolute inset-0 bg-[linear-gradient(120deg,rgb(var(--v2-background-rgb)/0.12),transparent_52%,rgb(var(--v2-background-rgb)/0.55))]"
              aria-hidden="true"
            />
            <div className="absolute left-5 top-5 flex items-center gap-3 border border-border bg-background/75 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.24em] backdrop-blur-md sm:left-7 sm:top-7 sm:text-[10px]">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_rgb(var(--v2-primary-rgb)/0.9)]" />
              Detail study
            </div>
            {fabricLabel || fabricValue || fabricTag ? (
              <figcaption className="absolute inset-x-5 bottom-5 border border-border bg-background/85 p-5 backdrop-blur-md sm:inset-x-7 sm:bottom-7 sm:p-6">
                <div className="flex items-end justify-between gap-5">
                  <div>
                    {fabricLabel ? (
                      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[10px]">
                        {fabricLabel}
                      </p>
                    ) : null}
                    {fabricValue ? (
                      <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                        {fabricValue}
                      </p>
                    ) : null}
                  </div>
                  {fabricTag ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary-readable sm:text-[10px]">
                      {fabricTag}
                    </span>
                  ) : null}
                </div>
              </figcaption>
            ) : null}
          </motion.figure>

          <div className="lg:col-span-5 lg:pl-4 xl:pl-8">
            <V2Reveal y={30} initiallyVisible={preview}>
              {firstLine || secondLine ? (
                <h2
                  id={headingId}
                  className="font-display text-[clamp(3.5rem,6.5vw,6.75rem)] font-bold leading-[0.8] tracking-[-0.07em]"
                >
                  {firstLine ? (
                    <span className="block">{firstLine}</span>
                  ) : null}
                  {secondLine ? (
                    <span className="block text-primary-readable">
                      {secondLine}
                    </span>
                  ) : null}
                </h2>
              ) : (
                <h2 id={headingId} className="sr-only">
                  {eyebrow || "Product standards"}
                </h2>
              )}
              {body ? (
                <p className="mt-7 max-w-lg border-l border-primary pl-5 text-sm leading-7 text-muted-foreground sm:mt-9 sm:pl-7 sm:text-base sm:leading-8">
                  {body}
                </p>
              ) : null}
            </V2Reveal>

            {items.length > 0 ? (
              <ol className="mt-12 grid grid-cols-2 border-l border-t border-border sm:mt-16">
                {items.map((item, index) => {
                  const Icon = craftIcons[item.icon] || Layers;
                  return (
                    <motion.li
                      key={`${item.label}-${index}`}
                      className="group relative min-h-48 border-b border-r border-border bg-background/70 p-5 transition-colors hover:bg-primary/[0.045] sm:min-h-52 sm:p-6"
                      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                      whileInView={
                        reduceMotion ? undefined : { opacity: 1, y: 0 }
                      }
                      whileHover={
                        reduceMotion ? undefined : { y: -5, scale: 1.01 }
                      }
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{
                        duration: reduceMotion ? 0.01 : 0.55,
                        delay: Math.min(index * 0.055, 0.28),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid size-10 place-items-center border border-primary/35 text-primary-readable transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h3 className="mt-7 font-display text-xl font-semibold leading-tight tracking-[-0.03em] sm:text-2xl">
                        {item.label || `Detail ${index + 1}`}
                      </h3>
                      {item.sub ? (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                          {item.sub}
                        </p>
                      ) : null}
                      <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                    </motion.li>
                  );
                })}
              </ol>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
