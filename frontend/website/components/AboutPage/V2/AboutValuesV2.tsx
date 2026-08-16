"use client";

import { useId } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { V2Reveal } from "@/components/HomePage/V2Motion";
import {
  configString,
  parseValues,
  type AboutV2BaseProps,
} from "./aboutV2Config";

export type AboutValuesV2Props = AboutV2BaseProps;

export default function AboutValuesV2({
  config,
  preview = false,
}: AboutValuesV2Props) {
  const headingId = useId();
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const eyebrow = configString(config, "eyebrow");
  const title = configString(config, "title");
  const values = parseValues(config);

  if (values.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden border-y border-border bg-card/35 py-24 text-foreground motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:py-32 lg:py-40"
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute -right-[0.08em] top-14 select-none font-display text-[clamp(8rem,24vw,24rem)] font-black leading-none tracking-[-0.09em] text-transparent opacity-[0.07] [-webkit-text-stroke:1px_rgb(var(--v2-foreground-rgb)/0.8)]"
        aria-hidden="true"
      >
        {String(values.length).padStart(2, "0")}
      </div>
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
        <V2Reveal
          className="grid gap-8 border-t border-foreground/30 pt-6 lg:grid-cols-12 lg:items-end"
          initiallyVisible={preview}
        >
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-[11px]">
              <span className="h-px w-10 bg-primary" aria-hidden="true" />
              {eyebrow || "Our principles"}
            </div>
          </div>
          <div className="lg:col-span-8">
            {title ? (
              <h2
                id={headingId}
                className="max-w-[12ch] text-balance font-display text-[clamp(3.5rem,8vw,7.5rem)] font-bold leading-[0.82] tracking-[-0.065em]"
              >
                {title}
              </h2>
            ) : (
              <h2 id={headingId} className="sr-only">
                {eyebrow || "Our principles"}
              </h2>
            )}
          </div>
          <div className="hidden justify-self-end font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground lg:col-span-1 lg:block">
            Index
          </div>
        </V2Reveal>

        <ol className="mt-16 border-t border-border sm:mt-20 lg:ml-[16.666%] lg:mt-24">
          {values.map((value, index) => (
            <motion.li
              key={`${value.title}-${index}`}
              className="group relative grid gap-5 border-b border-border py-8 transition-colors duration-300 hover:bg-primary/[0.035] sm:grid-cols-[5rem_minmax(0,1fr)] sm:py-10 lg:grid-cols-[7rem_minmax(0,0.8fr)_minmax(16rem,1fr)_auto] lg:items-start lg:gap-8 lg:py-12"
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              whileHover={reduceMotion ? undefined : { x: 8 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.65,
                delay: Math.min(index * 0.07, 0.28),
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="font-mono text-[10px] tracking-[0.25em] text-primary-readable sm:pt-1">
                / {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-3xl font-semibold leading-none tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                {value.title || `Principle ${index + 1}`}
              </h3>
              {value.body ? (
                <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:col-start-2 sm:text-base sm:leading-8 lg:col-start-auto">
                  {value.body}
                </p>
              ) : (
                <span />
              )}
              <span className="hidden size-11 place-items-center border border-border text-muted-foreground transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground lg:grid">
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100" />
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
