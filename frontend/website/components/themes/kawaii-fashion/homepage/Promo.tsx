import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";
import type { Promotion } from "@/type/promotionType";

interface KawaiiFashionPromoProps {
  promotion: Promotion;
  title?: string | null;
  subtitle?: string | null;
  ctaHref?: string;
  ctaLabel?: string | null;
  kicker?: string | null;
  limitedLabel?: string | null;
  discountSuffix?: string | null;
  imageEyebrow?: string | null;
  imageTitle?: string | null;
  ctaFallbackLabel?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

export default function KawaiiFashionPromo({
  promotion,
  title,
  subtitle,
  ctaHref,
  ctaLabel,
  kicker,
  limitedLabel,
  discountSuffix,
  imageEyebrow,
  imageTitle,
  ctaFallbackLabel,
  imageUrl,
  imageAlt,
}: KawaiiFashionPromoProps) {
  const heading = title?.trim() || promotion.title?.trim();
  if (!heading) return null;

  const bannerImage = imageUrl ?? promotion.imageUrl;
  const bannerAlt = imageAlt?.trim() || heading;

  const description = subtitle?.trim() || promotion.description?.trim();
  const href = safeKawaiiHref(ctaHref || promotion.ctaUrl, "/product");
  const label =
    ctaLabel?.trim() || promotion.ctaLabel?.trim() || ctaFallbackLabel?.trim();
  const normalizedKicker = kicker?.trim();
  const normalizedLimitedLabel = limitedLabel?.trim();
  const normalizedDiscountSuffix = discountSuffix?.trim();
  const normalizedImageEyebrow = imageEyebrow?.trim();
  const normalizedImageTitle = imageTitle?.trim();
  const discount =
    promotion.discountPercent && promotion.discountPercent > 0
      ? Math.min(100, Math.round(promotion.discountPercent))
      : null;

  return (
    <section className="bg-background py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="grid overflow-hidden border border-border bg-surface lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[440px] flex-col justify-between overflow-hidden p-7 sm:min-h-[500px] sm:p-10 lg:min-h-[590px] lg:p-14 xl:p-16">
            <div className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-[9999px] bg-primary/15 blur-3xl" />
            {normalizedKicker || normalizedLimitedLabel ? (
              <div className="relative flex items-center justify-between gap-4">
                {normalizedKicker ? (
                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-readable sm:text-[11px]">
                    <Sparkles className="size-4" aria-hidden="true" />
                    {normalizedKicker}
                  </p>
                ) : null}
                {normalizedLimitedLabel ? (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {normalizedLimitedLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="relative py-12">
              {discount ? (
                <p className="mb-5 font-display text-6xl font-semibold leading-none tracking-[-0.06em] text-primary-readable sm:text-7xl lg:text-8xl">
                  {discount}%
                  {normalizedDiscountSuffix ? (
                    <span className="ml-2 align-middle text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                      {normalizedDiscountSuffix}
                    </span>
                  ) : null}
                </p>
              ) : null}
              <h2 className="max-w-[11ch] text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
                {heading}
              </h2>
              {description ? (
                <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {label ? (
              <Link
                href={href}
                className="group relative inline-flex min-h-12 w-fit items-center gap-4 bg-primary px-6 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface motion-reduce:transition-none"
              >
                {label}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-card lg:min-h-full">
            {bannerImage ? (
              <Image
                src={bannerImage}
                alt={bannerAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.02] motion-reduce:transition-none"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,color-mix(in_srgb,var(--primary)_28%,transparent),transparent_26%),linear-gradient(145deg,var(--card),var(--surface))]" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/25 to-transparent" />
            {normalizedImageEyebrow || normalizedImageTitle ? (
              <div className="absolute bottom-5 left-5 border border-background/70 bg-background/90 px-4 py-3 backdrop-blur-sm sm:bottom-8 sm:left-8">
                {normalizedImageEyebrow ? (
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-primary-readable">
                    {normalizedImageEyebrow}
                  </p>
                ) : null}
                {normalizedImageTitle ? (
                  <p className="mt-1 font-display text-lg font-semibold text-foreground">
                    {normalizedImageTitle}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
