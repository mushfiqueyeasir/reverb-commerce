import { useId } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { configString } from "@/components/AboutPage/V2/aboutV2Config";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";
import type { KawaiiAboutRendererProps } from "./types";

export default function KawaiiAboutCta({ config }: KawaiiAboutRendererProps) {
  const headingId = useId();
  const eyebrow = configString(config, "eyebrow");
  const title = configString(config, "title");
  const accessibleLabel = configString(config, "accessible_label");
  const headingText = title || accessibleLabel || eyebrow;
  const body = configString(config, "body");
  const primaryLabel = configString(config, "cta_primary_label");
  const primaryHref = safeKawaiiHref(
    configString(config, "cta_primary_url"),
    "/product",
  );
  const secondaryLabel = configString(config, "cta_secondary_label");
  const secondaryHref = safeKawaiiHref(
    configString(config, "cta_secondary_url"),
    "/reviews",
  );

  if (!eyebrow && !title && !body && !primaryLabel && !secondaryLabel) {
    return null;
  }

  return (
    <section
      className="bg-background py-16 text-foreground sm:py-24 lg:py-32"
      aria-labelledby={headingText ? headingId : undefined}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="relative overflow-hidden border border-border bg-surface px-6 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />
          <Sparkles
            className="pointer-events-none absolute right-8 top-8 size-8 rotate-12 text-primary/25 sm:right-12 sm:top-10"
            aria-hidden="true"
          />
          <div className="relative max-w-4xl">
            {eyebrow ? (
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <span className="h-px w-7 bg-primary" aria-hidden="true" />
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                id={headingId}
                className="mt-5 text-balance font-display text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[0.9] tracking-[-0.05em]"
              >
                {title}
              </h2>
            ) : headingText ? (
              <h2 id={headingId} className="sr-only">
                {headingText}
              </h2>
            ) : null}
            {body ? (
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {body}
              </p>
            ) : null}
            {primaryLabel || secondaryLabel ? (
              <div className="mt-9 flex flex-wrap gap-3">
                {primaryLabel ? (
                  <Link
                    href={primaryHref}
                    className="group inline-flex min-h-12 items-center gap-4 bg-primary px-6 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface motion-reduce:transition-none"
                  >
                    {primaryLabel}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                ) : null}
                {secondaryLabel ? (
                  <Link
                    href={secondaryHref}
                    className="group inline-flex min-h-12 items-center gap-2 border-b border-primary pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface motion-reduce:transition-none"
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
        </div>
      </div>
    </section>
  );
}