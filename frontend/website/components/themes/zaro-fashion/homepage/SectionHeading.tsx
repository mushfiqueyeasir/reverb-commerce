import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { safeZaroHref } from "@/components/themes/zaro-fashion/safeHref";

interface ZaroSectionHeadingProps {
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  align?: "left" | "center";
  dark?: boolean;
}

export default function ZaroSectionHeading({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  ctaHref = "/product",
  align = "left",
  dark = false,
}: ZaroSectionHeadingProps) {
  const centered = align === "center";
  const normalizedEyebrow = eyebrow?.trim();
  const normalizedTitle = title?.trim();
  const normalizedSubtitle = subtitle?.trim();
  const normalizedCtaLabel = ctaLabel?.trim();
  const hasCopy = Boolean(
    normalizedEyebrow || normalizedTitle || normalizedSubtitle,
  );

  if (!hasCopy && !normalizedCtaLabel) return null;

  const titleColor = dark ? "text-white" : "text-[#1f1f1b]";
  const subColor = dark ? "text-white/75" : "text-[#7e796a]";
  const eyebrowColor = dark ? "text-[#ffc400]" : "text-[#7e796a]";

  return (
    <header
      className={`flex flex-col gap-6 ${
        centered
          ? "items-center text-center"
          : "lg:flex-row lg:items-end lg:justify-between"
      }`}
    >
      <div className={centered ? "flex flex-col items-center" : ""}>
        {normalizedEyebrow ? (
          <p
            className={`mb-3 text-[13px] font-medium uppercase tracking-[0.16em] ${eyebrowColor}`}
          >
            {normalizedEyebrow}
          </p>
        ) : null}
        {normalizedTitle ? (
          <h2 className="text-balance font-display text-3xl font-medium leading-[1.15] tracking-[-0.01em] sm:text-4xl lg:text-[2.5rem]">
            <span className={titleColor}>{normalizedTitle}</span>
          </h2>
        ) : null}
        {normalizedSubtitle ? (
          <p
            className={`mt-4 max-w-xl text-base leading-relaxed sm:text-lg ${subColor} ${
              centered ? "mx-auto" : ""
            }`}
          >
            {normalizedSubtitle}
          </p>
        ) : null}
      </div>
      {normalizedCtaLabel ? (
        <Link
          href={safeZaroHref(ctaHref, "/product")}
          className={`group inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-7 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1b] focus-visible:ring-offset-4 focus-visible:ring-offset-background ${
            dark
              ? "bg-white text-[#1f1f1b] hover:bg-[#ffc400]"
              : "bg-[#1f1f1b] text-white hover:bg-[#ffc400] hover:text-[#1f1f1b]"
          }`}
        >
          {normalizedCtaLabel}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      ) : null}
    </header>
  );
}
