import { useId } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { configString } from "@/components/AboutPage/V2/aboutV2Config";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";
import type { KawaiiAboutRendererProps } from "./types";

export default function KawaiiAboutCta({ config }: KawaiiAboutRendererProps) {
  const headingId = useId();
  const eyebrow = configString(config, "eyebrow");
  const title = configString(config, "title");
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
      className="bg-background px-5 py-16 text-foreground sm:px-8 sm:py-24 lg:px-12 lg:py-28"
      aria-labelledby={headingId}
    >
      <div className="relative mx-auto max-w-[1500px] overflow-hidden rounded-md border border-border bg-[linear-gradient(125deg,var(--surface),color-mix(in_srgb,var(--surface)_68%,#d8ceff))] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div
          className="absolute -right-24 -top-28 size-80 rounded-full border-[3rem] border-card/45 sm:size-[28rem]"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 right-1/4 size-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-4xl">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2
              id={headingId}
              className="mt-5 text-balance font-display text-[clamp(3rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.055em]"
            >
              {title}
            </h2>
          ) : (
            <h2 id={headingId} className="sr-only">
              {eyebrow || "Continue exploring"}
            </h2>
          )}
          {body ? (
            <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {body}
            </p>
          ) : null}
          {primaryLabel || secondaryLabel ? (
            <div className="mt-9 flex flex-wrap gap-3">
              {primaryLabel ? (
                <Link
                  href={primaryHref}
                  className="group inline-flex min-h-13 items-center gap-4 rounded-sm bg-primary px-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
                >
                  {primaryLabel}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ) : null}
              {secondaryLabel ? (
                <Link
                  href={secondaryHref}
                  className="inline-flex min-h-13 items-center rounded-sm border border-foreground/25 bg-card/70 px-6 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
