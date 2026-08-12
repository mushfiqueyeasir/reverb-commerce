"use client";

import { useId } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { V2Reveal } from "@/components/HomePage/V2Motion";
import {
  configString,
  htmlParagraphs,
  type AboutV2ImageProps,
} from "./aboutV2Config";

export type AboutStoryV2Props = AboutV2ImageProps;

export default function AboutStoryV2({
  config,
  imageUrl,
  preview = false,
}: AboutStoryV2Props) {
  const headingId = useId();
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const eyebrow = configString(config, "eyebrow");
  const title = configString(config, "title");
  const paragraphs = htmlParagraphs(configString(config, "body_html"));
  const extra = configString(config, "extra");

  if (!eyebrow && !title && paragraphs.length === 0 && !extra && !imageUrl) {
    return null;
  }

  return (
    <section
      className="relative overflow-hidden bg-background py-24 text-foreground motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:py-32 lg:py-44"
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-[31%] h-px bg-border"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-12 gap-x-4 sm:gap-x-6 lg:gap-x-8">
          <V2Reveal
            className="col-span-12 border-t border-foreground/30 pt-5 sm:col-span-4"
            initiallyVisible={preview}
          >
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-[11px]">
              <span className="h-px w-10 bg-primary" aria-hidden="true" />
              {eyebrow || "Our story"}
            </div>
          </V2Reveal>
          <V2Reveal
            className="col-span-12 mt-8 sm:col-span-8 sm:mt-0 lg:col-span-7"
            y={30}
            initiallyVisible={preview}
          >
            {title ? (
              <h2
                id={headingId}
                className="max-w-[12ch] text-balance font-display text-[clamp(3.5rem,8.5vw,8.5rem)] font-bold leading-[0.8] tracking-[-0.07em]"
              >
                {title}
              </h2>
            ) : (
              <h2 id={headingId} className="sr-only">
                {eyebrow || "Our story"}
              </h2>
            )}
          </V2Reveal>
          <div className="col-span-12 mt-7 hidden items-end justify-end font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground lg:col-span-1 lg:mt-0 lg:flex">
            <span className="[writing-mode:vertical-rl]">
              Editorial / Origin
            </span>
          </div>

          <motion.figure
            className="relative col-span-12 -ml-5 mt-14 aspect-[5/4] overflow-hidden border-y border-r border-border bg-surface sm:-ml-8 sm:mt-20 sm:aspect-[4/3] lg:col-span-8 lg:-ml-10 lg:mt-28 lg:aspect-[16/11]"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, clipPath: "inset(0 0 18% 0)" }
            }
            whileInView={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{
              duration: reduceMotion ? 0.01 : 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title || "Our story"}
                fill
                sizes="(max-width: 1024px) 100vw, 68vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgb(var(--v2-primary-rgb)/0.36),transparent_30%),linear-gradient(132deg,var(--card),var(--surface)_54%,var(--background))]">
                <div className="absolute inset-[12%] border border-primary/25" />
                <div className="absolute left-[23%] top-[18%] h-[64%] w-px bg-primary/55" />
                <div className="absolute left-[12%] top-1/2 h-px w-[76%] bg-border" />
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/10"
              aria-hidden="true"
            />
            <figcaption className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/70 sm:inset-x-7 sm:bottom-7 sm:text-[10px]">
              <span>{eyebrow || "Point of origin"}</span>
              <span>Frame / 01</span>
            </figcaption>
          </motion.figure>

          <V2Reveal
            className="col-span-11 col-start-2 mt-12 sm:col-span-8 sm:col-start-5 sm:-mt-16 lg:col-span-5 lg:col-start-8 lg:-mt-28"
            delay={0.12}
            y={28}
            initiallyVisible={preview}
          >
            <article className="relative border-t border-primary bg-background/95 px-0 pb-2 pt-7 sm:p-9 lg:p-12 lg:backdrop-blur-md">
              <div className="mb-9 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground sm:text-[10px]">
                <span>From the beginning</span>
                <span className="text-primary">
                  01 — {String(paragraphs.length).padStart(2, "0")}
                </span>
              </div>

              {paragraphs.length > 0 ? (
                <div className="space-y-6 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={`${paragraph.slice(0, 36)}-${index}`}
                      className={
                        index === 0
                          ? "font-display text-xl font-medium leading-[1.35] tracking-[-0.02em] text-foreground first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-primary sm:text-2xl"
                          : undefined
                      }
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}

              {extra ? (
                <blockquote
                  className={`border-l-2 border-primary pl-5 font-display text-xl font-semibold leading-snug tracking-[-0.025em] sm:text-2xl ${paragraphs.length > 0 ? "mt-9" : ""}`}
                >
                  {extra}
                </blockquote>
              ) : null}
            </article>
          </V2Reveal>
        </div>
      </div>
    </section>
  );
}
