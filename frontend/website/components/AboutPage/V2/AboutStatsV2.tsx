"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { V2Reveal } from "@/components/HomePage/V2Motion";
import { parseStats, type AboutV2BaseProps } from "./aboutV2Config";

export type AboutStatsV2Props = AboutV2BaseProps;

export default function AboutStatsV2({
  config,
  preview = false,
}: AboutStatsV2Props) {
  const headingId = useId();
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const items = parseStats(config);

  if (items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden border-y border-border bg-surface/55 py-8 text-foreground motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:py-10 lg:py-12"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="sr-only">
        Company highlights
      </h2>
      <div className="mx-auto max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="mb-6 flex items-center justify-between gap-5 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[10px]">
          <span className="flex items-center gap-3">
            <span className="size-1.5 bg-primary shadow-[0_0_12px_rgb(var(--v2-primary-rgb)/0.9)]" />
            Signal / Live standards
          </span>
          <span>{String(items.length).padStart(2, "0")} indicators</span>
        </div>

        <dl className="grid grid-cols-2 border-l border-t border-border lg:grid-cols-4">
          {items.map((item, index) => (
            <V2Reveal
              key={`${item.label}-${item.value}-${index}`}
              className="relative min-h-44 border-b border-r border-border bg-background/35 p-5 sm:min-h-52 sm:p-7 lg:min-h-60 lg:p-8"
              delay={Math.min(index * 0.07, 0.28)}
              y={20}
              initiallyVisible={preview}
            >
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground sm:text-[10px]">
                  <dt>{item.label || `Indicator ${index + 1}`}</dt>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <dd className="break-words font-display text-[clamp(1.8rem,4vw,4.25rem)] font-semibold leading-[0.88] tracking-[-0.055em]">
                  {item.value}
                </dd>
                <div
                  className="relative h-px overflow-hidden bg-border"
                  aria-hidden="true"
                >
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_12px_rgb(var(--v2-primary-rgb)/0.8)]"
                    initial={reduceMotion ? false : { width: 0 }}
                    whileInView={{ width: `${58 + ((index * 13) % 38)}%` }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{
                      duration: reduceMotion ? 0.01 : 0.9,
                      delay: Math.min(index * 0.08, 0.32),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </div>
              </div>
            </V2Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
