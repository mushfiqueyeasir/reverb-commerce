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
      className="relative isolate overflow-hidden bg-background text-foreground"
      aria-labelledby={headingText ? headingId : undefined}
    >
      <div
        className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(135deg,var(--surface),color-mix(in_srgb,var(--surface)_72%,#d8ceff))]"
        aria-hidden="true"
      />
      <div
        className="absolute -left-24 top-32 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid min-h-[720px] max-w-[1500px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(25rem,1.08fr)] lg:px-12 lg:py-24">
        <div className="relative z-10 max-w-2xl lg:py-16">
          {eyebrow ? (
            <p className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <span className="h-px w-9 bg-primary" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          {firstLine || secondLine ? (
            <Heading
              id={headingId}
              className="text-balance font-display text-[clamp(3.25rem,8vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.055em]"
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
            <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          ) : null}
          {primaryLabel || secondaryLabel ? (
            <div className="mt-9 flex flex-wrap gap-3">
              {primaryLabel ? (
                <Link
                  href={primaryHref}
                  className="group inline-flex min-h-12 items-center gap-3 rounded-sm bg-primary px-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
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
                  className="inline-flex min-h-12 items-center rounded-sm border border-border bg-card/80 px-6 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative mx-auto w-full max-w-2xl lg:mx-0 lg:justify-self-end">
          <div
            className="absolute -left-5 -top-5 h-2/3 w-2/3 bg-[color-mix(in_srgb,var(--surface)_68%,#d8ceff)] sm:-left-8 sm:-top-8"
            aria-hidden="true"
          />
          <figure className="relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-surface shadow-[0_24px_80px_rgb(var(--foreground-rgb)/0.08)] sm:ml-8">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt || ""}
                fill
                priority={!preview}
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_24%,color-mix(in_srgb,var(--primary)_28%,transparent),transparent_32%),linear-gradient(145deg,var(--card),var(--surface))]" />
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-foreground/15 via-transparent to-transparent"
              aria-hidden="true"
            />
          </figure>
          <div
            className="absolute -bottom-5 -right-3 h-28 w-32 border border-primary/35 bg-card/75 backdrop-blur-sm sm:-bottom-8 sm:-right-8 sm:h-36 sm:w-40"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
