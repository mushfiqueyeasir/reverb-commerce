"use client";

import { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import ProductCard from "@/components/Common/ProductCard";
import { V2Grid, V2Reveal } from "@/components/HomePage/V2Motion";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useStoreName } from "@/components/providers/StoreBrandProvider";
import type { TransformedProduct } from "@/type/productType";

export interface FeaturedProductsV2Props {
  products: TransformedProduct[];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  preview?: boolean;
}

function productAvailability(product: TransformedProduct) {
  const quantity = product.stock.reduce(
    (total, item) => total + Math.max(0, item.quantity || 0),
    0,
  );

  if (quantity === 0) return "Sold out";
  if (quantity <= 5) return "Low stock";
  return "In stock";
}

function productDiscount(product: TransformedProduct) {
  if (product.discount && product.discount > 0) {
    return Math.round(product.discount);
  }

  if (
    product.originalPrice > product.currentPrice &&
    product.originalPrice > 0
  ) {
    return Math.round(
      ((product.originalPrice - product.currentPrice) / product.originalPrice) *
        100,
    );
  }

  return 0;
}

function SupportingProduct({
  product,
  index,
}: {
  product: TransformedProduct;
  index: number;
}) {
  const availability = productAvailability(product);
  const discount = productDiscount(product);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">
        <span>
          Look {String(index + 2).padStart(2, "0")} / {availability}
        </span>
        {discount > 0 ? (
          <span className="text-primary">{discount}% off</span>
        ) : null}
      </div>
      <ProductCard
        id={product.id}
        title={product.title}
        image={product.image}
        hoverImage={product.hoverImage}
        images={product.images}
        originalPrice={product.originalPrice}
        currentPrice={product.currentPrice}
        discount={product.discount}
        href={product.href}
        stock={product.stock}
        sizingMode={product.sizingMode}
        sizeChart={product.sizeChart}
      />
    </>
  );
}

export default function FeaturedProductsV2({
  products,
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = "/product",
  preview = false,
}: FeaturedProductsV2Props) {
  const reduceMotion = Boolean(useReducedMotion()) || preview;
  const { format } = useCurrency();
  const storeName = useStoreName();
  const headingId = useId();

  if (products.length === 0) return null;

  const [spotlight, ...supportingProducts] = products.slice(0, 5);
  const availability = productAvailability(spotlight);
  const discount = productDiscount(spotlight);
  const isReduced = spotlight.originalPrice > spotlight.currentPrice;

  return (
    <section
      className="relative overflow-hidden py-20 motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none sm:py-28 lg:py-40"
      aria-labelledby={headingId}
    >
      <V2Grid className="opacity-[0.07] [mask-image:linear-gradient(to_bottom,transparent,var(--background)_18%,var(--background)_78%,transparent)]" />
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10">
        <V2Reveal
          className="mb-12 grid gap-7 border-b border-border pb-10 lg:mb-16 lg:grid-cols-12 lg:items-end lg:pb-14"
          initiallyVisible={preview}
        >
          <div className="lg:col-span-8">
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-[11px]">
              <span className="h-px w-10 bg-primary" aria-hidden="true" />
              {eyebrow || "The featured runway"}
            </div>
            <h2
              id={headingId}
              className="max-w-5xl font-display text-5xl font-bold leading-[0.84] tracking-[-0.06em] sm:text-7xl lg:text-[6.5rem]"
            >
              {title || "One look ahead."}
            </h2>
          </div>
          <div className="flex flex-col items-start gap-7 lg:col-span-4 lg:items-end">
            {subtitle ? (
              <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base lg:text-right">
                {subtitle}
              </p>
            ) : null}
            {ctaLabel ? (
              <Link
                href={ctaHref}
                className="group inline-flex min-h-11 items-center gap-3 border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              >
                {ctaLabel}
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>
        </V2Reveal>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          <motion.div
            className="group relative min-h-[560px] overflow-hidden rounded-[2rem] border border-border bg-surface sm:min-h-[720px] lg:col-span-8 lg:min-h-[780px]"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, clipPath: "inset(0 0 100% 0)" }
            }
            whileInView={
              reduceMotion
                ? undefined
                : { opacity: 1, clipPath: "inset(0 0 0% 0)" }
            }
            whileHover={reduceMotion ? undefined : "hover"}
            viewport={{ once: true, amount: 0.14 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute -inset-y-7 inset-x-0"
              variants={{ hover: { scale: 1.035, y: -8 } }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={spotlight.image}
                alt={spotlight.title}
                fill
                sizes="(max-width: 1024px) 100vw, 68vw"
                className="object-cover"
              />
              {spotlight.hoverImage ? (
                <motion.div
                  className="absolute inset-0 opacity-0"
                  variants={{ hover: { opacity: 1 } }}
                  transition={{ duration: 0.55 }}
                >
                  <Image
                    src={spotlight.hoverImage}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 68vw"
                    className="object-cover"
                  />
                </motion.div>
              ) : null}
            </motion.div>
            <div
              className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/25"
              aria-hidden="true"
            />
            <Link
              href={spotlight.href}
              className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              aria-label={`View ${spotlight.title}`}
            />
            <div className="pointer-events-none absolute inset-x-5 top-5 z-20 flex items-center justify-between gap-4 sm:inset-x-8 sm:top-8">
              <span className="rounded-full border border-border bg-background/80 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground backdrop-blur-md sm:text-[10px]">
                Spotlight / 01
              </span>
              <span className="rounded-full border border-border bg-background/80 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground backdrop-blur-md sm:text-[10px]">
                {availability}
              </span>
            </div>
            <div className="pointer-events-none absolute bottom-5 left-5 z-20 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground sm:bottom-8 sm:left-8 sm:text-[10px]">
              Image-led edit / {storeName}
            </div>
          </motion.div>

          <V2Reveal
            className="flex flex-col justify-between border-y border-border py-8 lg:col-span-4 lg:py-10"
            delay={0.16}
            initiallyVisible={preview}
          >
            <div>
              <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span>{storeName}</span>
                <span>Look 01</span>
              </div>
              <h3 className="mt-10 font-display text-5xl font-bold leading-[0.88] tracking-[-0.055em] sm:text-6xl lg:text-5xl xl:text-6xl">
                {spotlight.title}
              </h3>

              <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-border pb-8">
                <span className="font-display text-4xl font-semibold tracking-[-0.04em]">
                  {format(spotlight.currentPrice)}
                </span>
                {isReduced ? (
                  <span className="pb-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground line-through">
                    {format(spotlight.originalPrice)}
                  </span>
                ) : null}
              </div>

              <dl className="divide-y divide-border font-mono text-[10px] uppercase tracking-[0.2em]">
                <div className="flex items-center justify-between gap-4 py-5">
                  <dt className="text-muted-foreground">Availability</dt>
                  <dd
                    className={
                      availability === "Sold out"
                        ? "text-muted-foreground"
                        : "text-primary"
                    }
                  >
                    {availability}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-5">
                  <dt className="text-muted-foreground">Price status</dt>
                  <dd>{discount > 0 ? `${discount}% off` : "Regular price"}</dd>
                </div>
              </dl>
            </div>

            <Link
              href={spotlight.href}
              className="group mt-12 flex min-h-14 items-center justify-between rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              {availability === "Sold out" ? "View details" : "View product"}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </V2Reveal>
        </div>

        {supportingProducts.length > 0 ? (
          <div className="mt-20 sm:mt-24 lg:mt-32">
            <V2Reveal
              className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-5"
              initiallyVisible={preview}
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-primary">
                  Continue the runway
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  The supporting edit
                </h3>
              </div>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
                Scroll to explore
              </span>
            </V2Reveal>
            <ol
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:gap-7 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-track]:bg-surface [&::-webkit-scrollbar]:h-1"
              aria-label="Supporting featured products"
              tabIndex={0}
            >
              {supportingProducts.map((product, index) => (
                <motion.li
                  key={product.id}
                  className="w-[84vw] max-w-[340px] shrink-0 snap-start sm:w-[330px] lg:w-[360px] lg:max-w-none"
                  initial={reduceMotion ? false : { opacity: 0, y: 34 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.22 }}
                  transition={{
                    duration: 0.7,
                    delay: Math.min(index * 0.07, 0.35),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <SupportingProduct product={product} index={index} />
                </motion.li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
