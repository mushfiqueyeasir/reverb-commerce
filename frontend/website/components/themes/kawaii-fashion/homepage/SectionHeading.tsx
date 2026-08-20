import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";

interface SectionHeadingProps {
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  align?: "left" | "center";
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  ctaHref = "/product",
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";
  const normalizedEyebrow = eyebrow?.trim();
  const normalizedTitle = title?.trim();
  const normalizedSubtitle = subtitle?.trim();
  const normalizedCtaLabel = ctaLabel?.trim();
  const hasCopy = Boolean(
    normalizedEyebrow || normalizedTitle || normalizedSubtitle,
  );

  if (!hasCopy && !normalizedCtaLabel) return null;

  return (
    <header
      className={`mb-7 flex flex-col gap-5 sm:mb-12 ${
        centered
          ? "items-center text-center"
          : "md:flex-row md:items-end md:justify-between"
      }`}
    >
      {hasCopy ? (
        <div className="max-w-3xl">
          {normalizedEyebrow ? (
            <p
              className={`mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-readable ${
                centered ? "justify-center" : ""
              }`}
            >
              <span className="h-px w-7 bg-primary" aria-hidden="true" />
              {normalizedEyebrow}
              <span
                className={`h-px w-7 bg-primary ${centered ? "block" : "hidden"}`}
                aria-hidden="true"
              />
            </p>
          ) : null}
          {normalizedTitle ? (
            <h2 className="text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
              {normalizedTitle}
            </h2>
          ) : null}
          {normalizedSubtitle ? (
            <p
              className={`mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 ${
                centered ? "mx-auto" : ""
              }`}
            >
              {normalizedSubtitle}
            </p>
          ) : null}
        </div>
      ) : null}
      {normalizedCtaLabel ? (
        <Link
          href={safeKawaiiHref(ctaHref, "/product")}
          className="group inline-flex min-h-11 w-fit shrink-0 items-center gap-2 border-b border-primary pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-primary-readable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
        >
          {normalizedCtaLabel}
          <ArrowUpRight
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      ) : null}
    </header>
  );
}
