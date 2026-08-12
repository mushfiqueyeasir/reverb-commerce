"use client";

import { useId } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { V2Grid, V2Reveal } from "@/components/HomePage/V2Motion";
import { configString, type AboutV2BaseProps } from "./aboutV2Config";

export type AboutCtaV2Props = AboutV2BaseProps;

export default function AboutCtaV2({
  config,
  preview = false,
}: AboutCtaV2Props) {
  const headingId = useId();
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const eyebrow = configString(config, "eyebrow");
  const title = configString(config, "title");
  const body = configString(config, "body");
  const primaryLabel = configString(config, "cta_primary_label");
  const primaryHref = configString(config, "cta_primary_url") || "/product";
  const secondaryLabel = configString(config, "cta_secondary_label");
  const secondaryHref = configString(config, "cta_secondary_url") || "/reviews";

  if (!eyebrow && !title && !body && !primaryLabel && !secondaryLabel) {
    return null;
  }

  return (
    <section
      className="relative overflow-hidden bg-background px-5 py-16 text-foreground motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:px-8 sm:py-24 lg:px-10 lg:py-32"
      aria-labelledby={headingId}
    >
      <div className="relative mx-auto min-h-[620px] max-w-[1720px] overflow-hidden border border-primary/35 bg-card shadow-[0_42px_140px_rgb(var(--v2-primary-rgb)/0.18)] sm:min-h-[700px] lg:min-h-[760px]">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_78%_46%,rgb(var(--v2-primary-rgb)/0.34),transparent_28%),radial-gradient(circle_at_12%_100%,rgb(var(--v2-primary-rgb)/0.14),transparent_34%),linear-gradient(125deg,var(--card),var(--background)_68%)]"
          aria-hidden="true"
        />
        <V2Grid className="opacity-[0.13] [mask-image:linear-gradient(to_right,black,transparent_88%)]" />

        <div
          className="pointer-events-none absolute right-[-34%] top-1/2 aspect-square w-[92%] -translate-y-1/2 sm:right-[-24%] sm:w-[78%] lg:right-[-12%] lg:w-[58%]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(var(--v2-primary-rgb)/0.24),rgb(var(--v2-primary-rgb)/0.07)_38%,transparent_68%)] blur-2xl" />
          <motion.div
            className="absolute inset-[6%] rounded-full border border-primary/45 shadow-[0_0_80px_rgb(var(--v2-primary-rgb)/0.18),inset_0_0_80px_rgb(var(--v2-primary-rgb)/0.12)]"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute left-1/2 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_24px_rgb(var(--v2-primary-rgb)/1)]" />
            <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-1/2 bg-foreground" />
          </motion.div>
          <motion.div
            className="absolute inset-[18%] rounded-full border border-dashed border-foreground/25"
            animate={reduceMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[31%] rounded-full border border-primary/55 bg-background/45 backdrop-blur-sm"
            animate={
              reduceMotion
                ? undefined
                : { scale: [0.98, 1.035, 0.98], opacity: [0.75, 1, 0.75] }
            }
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-x-[5%] top-1/2 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="absolute inset-y-[5%] left-1/2 w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent" />
        </div>

        <div className="relative z-10 flex min-h-[620px] flex-col p-6 sm:min-h-[700px] sm:p-10 lg:min-h-[760px] lg:p-14 xl:p-16">
          <div className="flex items-start justify-between gap-6 border-t border-foreground/25 pt-4 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[10px]">
            <span className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_14px_rgb(var(--v2-primary-rgb)/0.9)]" />
              {eyebrow || "Community"}
            </span>
            <span>Finale / Open invitation</span>
          </div>

          <div className="my-auto max-w-5xl py-16 lg:w-[72%]">
            <V2Reveal y={36} initiallyVisible={preview}>
              {title ? (
                <h2
                  id={headingId}
                  className="text-balance font-display text-[clamp(3.7rem,9vw,9.5rem)] font-bold leading-[0.78] tracking-[-0.075em]"
                >
                  {title}
                </h2>
              ) : (
                <h2 id={headingId} className="sr-only">
                  {eyebrow || "Join our community"}
                </h2>
              )}
            </V2Reveal>

            {body ? (
              <V2Reveal delay={0.1} y={22} initiallyVisible={preview}>
                <p className="mt-8 max-w-2xl border-l border-primary pl-5 text-sm leading-7 text-foreground/70 sm:mt-10 sm:pl-7 sm:text-base sm:leading-8 lg:text-lg">
                  {body}
                </p>
              </V2Reveal>
            ) : null}

            {primaryLabel || secondaryLabel ? (
              <V2Reveal delay={0.18} y={18} initiallyVisible={preview}>
                <div className="mt-10 flex flex-wrap gap-3 sm:mt-12">
                  {primaryLabel ? (
                    <Link
                      href={primaryHref}
                      className="group inline-flex min-h-14 items-center gap-5 rounded-full bg-primary px-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-card sm:px-8 sm:text-[11px]"
                    >
                      {primaryLabel}
                      <span className="grid size-8 place-items-center rounded-full bg-primary-foreground/15">
                        <ArrowRight
                          className="size-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  ) : null}
                  {secondaryLabel ? (
                    <Link
                      href={secondaryHref}
                      className="group inline-flex min-h-14 items-center gap-4 rounded-full border border-foreground/35 bg-background/20 px-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground backdrop-blur-md transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-card sm:px-8 sm:text-[11px]"
                    >
                      {secondaryLabel}
                      <ArrowUpRight
                        className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  ) : null}
                </div>
              </V2Reveal>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-5 border-b border-foreground/25 pb-4 font-mono text-[9px] uppercase tracking-[0.26em] text-muted-foreground sm:text-[10px]">
            <span>Step through / Begin here</span>
            <span className="text-primary">Portal active</span>
          </div>
        </div>
      </div>
    </section>
  );
}
