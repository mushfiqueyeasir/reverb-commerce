"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { safeZaroHref } from "@/components/themes/zaro-fashion/safeHref";
import type { Promotion } from "@/type/promotionType";

interface ZaroPromoProps {
  promotion: Promotion;
  title?: string | null;
  subtitle?: string | null;
  ctaHref?: string;
  ctaLabel?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  countdownLabel?: string | null;
  shopSweaterLabel?: string | null;
  shopWomenLabel?: string | null;
  saleEyebrow?: string | null;
  saveBigTitle?: string | null;
  saveBigBody?: string | null;
  saveBigCtaLabel?: string | null;
  saveBigImageUrl?: string | null;
}

const COUNTDOWN_SECONDS = 23 * 3600 + 59 * 60 + 59;

interface CountdownParts {
  hours: string;
  minutes: string;
  seconds: string;
}

function formatParts(total: number): CountdownParts {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function ZaroCountdown() {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = formatParts(remaining);

  return (
    <div
      className="flex items-end gap-5"
      role="timer"
      aria-label="Time remaining on the sale"
    >
      {(
        [
          ["Hours", parts.hours],
          ["Minutes", parts.minutes],
          ["Seconds", parts.seconds],
        ] as const
      ).map(([label, value], index) => (
        <div key={label} className="flex items-end gap-5">
          {index > 0 ? (
            <span
              className="pb-10 font-display text-5xl font-extrabold text-white sm:text-6xl"
              aria-hidden="true"
            >
              :
            </span>
          ) : null}
          <div className="text-center">
            <span
              className="block font-display text-[64px] font-extrabold leading-[1em] text-white tabular-nums sm:text-[104px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {value}
            </span>
            <span className="mt-2 block text-[13px] font-medium uppercase tracking-[0.16em] text-white/80">
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ZaroPromo({
  promotion,
  title,
  subtitle,
  ctaHref,
  ctaLabel,
  imageUrl,
  imageAlt,
  countdownLabel,
  shopSweaterLabel,
  shopWomenLabel,
  saleEyebrow,
  saveBigTitle,
  saveBigBody,
  saveBigCtaLabel,
  saveBigImageUrl,
}: ZaroPromoProps) {
  const heading = title?.trim() || promotion.title?.trim();
  const description = subtitle?.trim() || promotion.description?.trim();
  const saleImage = imageUrl ?? promotion.imageUrl;
  const href = safeZaroHref(ctaHref || promotion.ctaUrl, "/product");
  const label = ctaLabel?.trim() || promotion.ctaLabel?.trim() || "Shop now";
  const discount =
    promotion.discountPercent && promotion.discountPercent > 0
      ? Math.min(100, Math.round(promotion.discountPercent))
      : 40;

  const saleEyebrowText = saleEyebrow?.trim() ?? "Elevated Style";
  const saleHeading = heading || "Sale now on";
  const countdownNote = countdownLabel?.trim() ?? "Ends soon";
  const bigTitle = saveBigTitle?.trim() || "Save Big";
  const bigBody =
    saveBigBody?.trim() ||
    "Take an extra 40% off selected styles from the newest Zaro collection.";
  const bigCta = saveBigCtaLabel?.trim() || "Shop New Arrivals";
  const bigImage =
    saveBigImageUrl ?? "/images/themes/zaro-fashion/save-big.png";
  const sweaterImage = "/images/themes/zaro-fashion/sale-sweater.png";

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#1f1f1b] py-16 text-white sm:py-24 lg:py-28">
        <Image
          src={saleImage || "/images/themes/zaro-fashion/sale-now-bg.jpg"}
          alt={imageAlt || ""}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent sm:from-black/70" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-[40px]">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#ffc400]">
              {saleEyebrowText}
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold leading-[1.05em] text-white sm:text-6xl">
              {saleHeading}
            </h2>
            {description ? (
              <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-white/85">
                {description}
              </p>
            ) : null}
            <div className="mt-10">
              <ZaroCountdown />
            </div>
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.16em] text-white/70">
              {countdownNote}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {label ? (
                <Link
                  href={href}
                  className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-medium text-[#1f1f1b] transition-colors hover:bg-[#ffc400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f1f1b] motion-reduce:transition-none"
                >
                  {label}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              ) : null}
              {shopSweaterLabel?.trim() ? (
                <span className="text-sm font-medium text-white/85">
                  {shopSweaterLabel.trim()}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {shopWomenLabel?.trim() ? (
          <div className="relative z-10 mx-auto mt-12 max-w-[1440px] px-6 sm:px-10 lg:px-[40px]">
            <Link
              href="/product"
              className="group inline-flex items-center gap-3 text-sm font-medium text-white transition-colors hover:text-[#ffc400]"
            >
              <Image
                src={sweaterImage}
                alt=""
                width={64}
                height={64}
                className="size-14 rounded-full border border-white/30 object-cover"
              />
              <span className="underline decoration-white/50 underline-offset-4">
                {shopWomenLabel.trim()}
              </span>
            </Link>
          </div>
        ) : null}
      </section>

      <section className="bg-[#f9f5f3] px-6 py-14 sm:px-10 sm:py-20 lg:px-[40px] lg:py-24">
        <div className="relative mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-10 overflow-hidden rounded-[8px] bg-gradient-to-r from-[#412253] to-[#a27252] px-8 py-14 text-white sm:px-12 lg:flex-row lg:items-center lg:px-16 lg:py-16">
          <span className="absolute -right-4 -top-4 grid size-24 place-items-center rounded-full border border-[#ffc400] text-center">
            <span>
              <span className="block font-display text-xl font-medium text-white">
                {discount}%
              </span>
              <span className="block text-[13px] font-medium text-white">
                off
              </span>
            </span>
          </span>
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/80">
              Season sale
            </p>
            <h2 className="mt-4 font-display text-6xl font-extrabold uppercase leading-[0.9em] tracking-[-0.01em] text-white sm:text-7xl lg:text-8xl">
              {bigTitle}
            </h2>
            <p className="mt-5 max-w-md text-lg font-medium leading-relaxed text-white/85">
              {bigBody}
            </p>
            <Link
              href={href}
              className="group mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-medium text-[#1f1f1b] transition-colors hover:bg-[#ffc400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#412253] motion-reduce:transition-none"
            >
              {bigCta}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </div>
          {bigImage ? (
            <div className="relative hidden w-full max-w-sm shrink-0 lg:block">
              <div className="relative aspect-square overflow-hidden rounded-full border border-white/25">
                <Image
                  src={bigImage}
                  alt={bigTitle}
                  fill
                  sizes="(min-width: 1024px) 24rem, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
