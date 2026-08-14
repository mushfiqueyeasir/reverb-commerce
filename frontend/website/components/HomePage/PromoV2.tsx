"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Promotion } from "@/type/promotionType";
import { V2Aurora, V2Grid, V2Particles, V2Reveal } from "./V2Motion";

export interface PromoV2Props {
  promotion: Promotion;
  title?: string | null;
  subtitle?: string | null;
  ctaHref?: string;
  ctaLabel?: string | null;
}

export default function PromoV2({
  promotion,
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: PromoV2Props) {
  const reduceMotion = useReducedMotion();

  if (!promotion) return null;

  const heading = title?.trim() || promotion.title?.trim();
  if (!heading) return null;

  const description = subtitle?.trim() || promotion.description?.trim();
  const href = ctaHref?.trim() || promotion.ctaUrl?.trim() || "/product";
  const label = ctaLabel?.trim() || promotion.ctaLabel?.trim() || "Shop offer";
  const discount =
    promotion.discountPercent && promotion.discountPercent > 0
      ? Math.min(100, Math.max(1, Math.round(promotion.discountPercent)))
      : null;

  return (
    <section className="relative isolate overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10">
        <V2Reveal>
          <motion.div
            className="relative min-h-[440px] overflow-hidden rounded-[1.75rem] border border-border bg-surface text-foreground shadow-[0_32px_110px_rgb(var(--v2-primary-rgb)/0.18)] sm:min-h-[520px] sm:rounded-[2.5rem] lg:min-h-[610px]"
            whileHover={reduceMotion ? undefined : { scale: 1.004 }}
            transition={{ duration: 0.35 }}
          >
            <V2Aurora className="mix-blend-screen opacity-35" />
            <V2Grid className="opacity-15 [mask-image:linear-gradient(to_right,var(--foreground),transparent_88%)]" />
            <V2Particles className="opacity-30" />

            <motion.div
              className="pointer-events-none absolute -inset-y-1/2 left-[-35%] z-20 w-1/3 -skew-x-12"
              style={{
                background:
                  "linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 24%, transparent), transparent)",
              }}
              animate={
                reduceMotion
                  ? undefined
                  : { x: ["0vw", "190vw"], opacity: [0, 0.75, 0] }
              }
              transition={{
                duration: 3.4,
                repeat: Infinity,
                repeatDelay: 2.6,
                ease: "easeInOut",
              }}
              aria-hidden="true"
            />

            <motion.div
              className="pointer-events-none absolute inset-3 z-20 rounded-2xl border-2 border-double border-primary/20 sm:inset-4 sm:rounded-[1.5rem]"
              animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />

            {promotion.imageUrl ? (
              <motion.div
                className="absolute inset-0 overflow-hidden"
                initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.9,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.div
                  className="absolute -inset-x-3 inset-y-0"
                  animate={
                    reduceMotion
                      ? undefined
                      : { x: [0, 8, 0], scale: [1, 1.02, 1] }
                  }
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Image
                    src={promotion.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1600px) 94vw, 1500px"
                    className="object-cover object-center lg:object-[62%_center]"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, color-mix(in srgb, var(--surface) 88%, transparent) 0%, color-mix(in srgb, var(--surface) 68%, transparent) 28%, color-mix(in srgb, var(--surface) 22%, transparent) 58%, color-mix(in srgb, var(--surface) 6%, transparent) 100%), linear-gradient(0deg, color-mix(in srgb, var(--surface) 52%, transparent) 0%, transparent 42%, color-mix(in srgb, var(--surface) 14%, transparent) 100%)",
                    }}
                    aria-hidden="true"
                  />
                </motion.div>
              </motion.div>
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 78% 25%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 24%), radial-gradient(circle at 68% 80%, color-mix(in srgb, var(--background) 55%, transparent), transparent 30%)",
                }}
                aria-hidden="true"
              />
            )}

            <div className="relative z-10 flex min-h-[440px] flex-col justify-between p-7 sm:min-h-[520px] sm:p-10 lg:min-h-[610px] lg:p-14 xl:p-16">
              <div className="flex items-center gap-3 font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground sm:text-[10px]">
                <span className="size-2 rounded-full bg-primary" />
                Current offer
              </div>

              <div className="relative -my-2 w-fit sm:-my-6">
                <motion.p
                  className="font-display text-[clamp(6.5rem,25vw,20rem)] font-black leading-[0.66] tracking-[-0.095em] text-primary"
                  initial={
                    reduceMotion ? false : { opacity: 0, y: 50, scale: 0.92 }
                  }
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {discount ? discount : "GO"}
                  {discount ? (
                    <span className="ml-1 align-top text-[0.3em] tracking-[-0.04em]">
                      %
                    </span>
                  ) : null}
                </motion.p>
                <motion.span
                  className="absolute -bottom-2 right-0 border-y border-foreground/25 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-foreground sm:bottom-0 sm:text-[11px]"
                  animate={
                    reduceMotion
                      ? undefined
                      : { x: [0, 7, 0], opacity: [0.72, 1, 0.72] }
                  }
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {discount ? "Off selected styles" : "Featured release"}
                </motion.span>
              </div>

              <div className="grid gap-5 sm:max-w-xl sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8">
                <div>
                  <h2 className="font-display text-2xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                    {heading}
                  </h2>
                  {description ? (
                    <p className="mt-3 max-w-md text-xs font-medium leading-5 text-muted-foreground sm:mt-4 sm:text-sm sm:leading-6">
                      {description}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={href}
                  className="group inline-flex min-h-12 w-fit shrink-0 items-center gap-3 rounded-full bg-primary px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface sm:min-h-14 sm:px-7 sm:text-[11px]"
                >
                  {label}
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-primary"
              animate={
                reduceMotion
                  ? undefined
                  : { scaleX: [0.15, 1, 0.15], originX: [0, 0.5, 1] }
              }
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
          </motion.div>
        </V2Reveal>
      </div>
    </section>
  );
}
