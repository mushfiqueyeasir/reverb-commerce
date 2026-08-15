import { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { configString } from "@/components/AboutPage/V2/aboutV2Config";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";
import type { KawaiiAboutRendererProps } from "./types";

export default function KawaiiAboutHero({
  config,
  imageUrl,
  preview = false,
  headingLevel = "h1",
}: KawaiiAboutRendererProps) {
  const headingId = useId();
  const eyebrow = configString(config, "eyebrow");
  const firstLine = configString(config, "headline_line1");
  const secondLine = configString(config, "headline_line2");
  const subtitle = configString(config, "subtitle");
  const accessibleLabel = configString(config, "accessible_label");
  const imageAlt = configString(config, "image_alt");
  const primaryLabel = configString(config, "cta_primary_label");
  const primaryHref = safeKawaiiHref(
    configString(config, "cta_primary_url"),
    "/product",
  );
  const secondaryLabel = configString(config, "cta_secondary_label");
  const secondaryHref = safeKawaiiHref(
    configString(config, "cta_secondary_url"),
    "/contact-us",
  );
  const headingText =
    [firstLine, secondLine].filter(Boolean).join(" ") ||
    accessibleLabel ||
    eyebrow;
  const Heading = headingLevel;

  if (
    !eyebrow &&
    !firstLine &&
    !secondLine &&
    !subtitle &&
    !primaryLabel &&
    !secondaryLabel &&
    !imageUrl
  ) {
    return null;
  }

  return (
    <section
      className="relative overflow-hidden bg-background pb-16 pt-8 text-foreground sm:pb-24 sm:pt-12 md:pt-20 lg:pb-32"
      aria-labelledby={headingText ? headingId : undefined}
    >
      <div
        className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-[9999px] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-[9999px] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 xl:gap-24">
        <div className="relative max-w-2xl">
          {eyebrow ? (
            <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <span className="h-px w-7 bg-primary" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          {firstLine || secondLine ? (
            <Heading
              id={headingId}
              className="text-balance font-display text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.05em]"
            >
              {firstLine ? <span className="block">{firstLine}</span> : null}
              {secondLine ? (
                <span className="block font-normal italic text-primary">
                  {secondLine}
                </span>
              ) : null}
            </Heading>
          ) : headingText ? (
            <Heading id={headingId} className="sr-only">
              {headingText}
            </Heading>
          ) : null}
          {subtitle ? (
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          ) : null}
          {primaryLabel || secondaryLabel ? (
            <div className="mt-9 flex flex-wrap gap-3">
              {primaryLabel ? (
                <Link
                  href={primaryHref}
                  className="group inline-flex min-h-12 items-center gap-4 bg-primary px-6 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
                >
                  {primaryLabel}
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              ) : null}
              {secondaryLabel ? (
                <Link
                  href={secondaryHref}
                  className="group inline-flex min-h-12 items-center border-b border-primary pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
                >
                  {secondaryLabel}
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {imageUrl ? (
          <div className="relative mx-auto w-full max-w-2xl lg:mx-0 lg:justify-self-end">
            <div
              className="absolute -left-5 -top-5 h-2/3 w-2/3 bg-[color-mix(in_srgb,var(--surface)_68%,#d8ceff)] sm:-left-8 sm:-top-8"
              aria-hidden="true"
            />
            <figure className="relative aspect-[4/5] overflow-hidden border border-border bg-surface sm:ml-8">
              <Image
                src={imageUrl}
                alt={imageAlt || ""}
                fill
                priority={!preview}
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover"
              />
              <span className="absolute bottom-4 right-4 grid size-10 place-items-center bg-background/90 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </figure>
          </div>
        ) : null}
      </div>
    </section>
  );
}
