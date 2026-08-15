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

  return (
    <header
      className={`mb-10 flex flex-col gap-5 sm:mb-14 ${
        centered
          ? "items-center text-center"
          : "md:flex-row md:items-end md:justify-between"
      }`}
    >
      <div className={centered ? "max-w-3xl" : "max-w-3xl"}>
        <p
          className={`mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary ${
            centered ? "justify-center" : ""
          }`}
        >
          <span className="h-px w-7 bg-primary" aria-hidden="true" />
          {eyebrow || "The daily edit"}
          <span
            className={`h-px w-7 bg-primary ${centered ? "block" : "hidden"}`}
            aria-hidden="true"
          />
        </p>
        <h2 className="text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
          {title || "Made for your favorite days"}
        </h2>
        {subtitle ? (
          <p
            className={`mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 ${
              centered ? "mx-auto" : ""
            }`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {ctaLabel ? (
        <Link
          href={safeKawaiiHref(ctaHref, "/product")}
          className="group inline-flex min-h-11 w-fit shrink-0 items-center gap-2 border-b border-primary pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
        >
          {ctaLabel}
          <ArrowUpRight
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      ) : null}
    </header>
  );
}
