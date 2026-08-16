import Image from "next/image";
import Link from "next/link";
import type { Promotion } from "@/type/promotionType";

interface PromoStripProps {
  promotion: Promotion;
  title?: string | null;
  subtitle?: string | null;
  ctaHref?: string;
  ctaLabel?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

export default function PromoStrip({
  promotion,
  title,
  subtitle,
  ctaHref = "/product",
  ctaLabel = "Shop the drop",
  imageUrl,
  imageAlt,
}: PromoStripProps) {
  const heading = title || promotion.title;
  const bannerImage = imageUrl ?? promotion.imageUrl;
  const hasImage = Boolean(bannerImage);

  return (
    <section className="relative isolate overflow-hidden border-y border-border">
      {hasImage ? (
        <Image
          src={bannerImage!}
          alt={imageAlt?.trim() || promotion.title}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={false}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 40%, rgb(var(--primary-rgb) / 0.22) 0%, transparent 55%), var(--background)",
          }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />

      <div className="relative mx-auto flex min-h-[420px] max-w-[1600px] items-center px-6 py-16 md:min-h-[480px] md:px-10 lg:min-h-[520px]">
        <div className="max-w-xl space-y-6">
          {promotion.discountPercent ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary-readable">
              Up to {promotion.discountPercent}% off
            </p>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary-readable">
              Limited drop
            </p>
          )}

          <h2 className="font-display text-4xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {heading}
          </h2>

          {subtitle || promotion.description ? (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {subtitle || promotion.description}
            </p>
          ) : null}

          <div className="pt-2">
            <Link
              href={ctaHref}
              className="inline-flex items-center rounded-full bg-primary px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
