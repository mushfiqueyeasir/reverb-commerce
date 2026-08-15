"use client";

import Image from "next/image";
import { ArrowUpRight, Bot, Sparkles } from "lucide-react";
import { openAiSearch } from "@/components/Common/searchUi";

interface KawaiiFashionAiSearchProps {
  eyebrow?: string | null;
  title?: string | null;
  body?: string | null;
  ctaLabel?: string | null;
  pillLabel?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  aiSearchEnabled?: boolean;
}

export default function KawaiiFashionAiSearch({
  eyebrow,
  title,
  body,
  ctaLabel,
  pillLabel,
  imageUrl,
  imageAlt,
  aiSearchEnabled = true,
}: KawaiiFashionAiSearchProps) {
  const normalizedEyebrow = eyebrow?.trim();
  const normalizedTitle = title?.trim();
  const normalizedBody = body?.trim();
  const normalizedCtaLabel = ctaLabel?.trim();
  const normalizedPillLabel = pillLabel?.trim();

  if (aiSearchEnabled === false) return null;
  if (!normalizedEyebrow || !normalizedTitle || !normalizedCtaLabel)
    return null;

  return (
    <div className="relative overflow-hidden bg-background px-4 pb-16 pt-4 sm:px-6 sm:pb-24 sm:pt-5 lg:px-10 lg:pb-32">
      <section
        aria-labelledby="kawaii-ai-search-title"
        className="relative isolate mx-auto max-w-[1520px] overflow-hidden rounded-2xl border border-primary/20 bg-surface"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 size-80 rounded-[9999px] bg-primary/20 blur-3xl" />
        <Sparkles
          className="pointer-events-none absolute left-10 top-10 size-10 -rotate-12 text-primary/20"
          aria-hidden="true"
        />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
          <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            {normalizedPillLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="size-3" aria-hidden="true" />
                {normalizedPillLabel}
              </span>
            ) : null}
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {normalizedEyebrow}
            </p>
            <h2
              id="kawaii-ai-search-title"
              className="mt-3 max-w-[14ch] text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl"
            >
              {normalizedTitle}
            </h2>
            {normalizedBody ? (
              <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                {normalizedBody}
              </p>
            ) : null}
            <button
              type="button"
              onClick={openAiSearch}
              className="group mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface motion-reduce:transition-none"
            >
              <Bot className="size-4" aria-hidden="true" />
              {normalizedCtaLabel}
              <ArrowUpRight
                className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="relative min-h-64 border-t border-primary/10 lg:min-h-[28rem] lg:border-l lg:border-t-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt || ""}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_28%,color-mix(in_srgb,var(--primary)_26%,transparent),transparent_32%),linear-gradient(145deg,var(--card),var(--surface))]" />
            )}
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 backdrop-blur-md">
              <span
                className="size-2 animate-pulse rounded-full bg-primary"
                aria-hidden="true"
              />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground">
                AI Shopping Advisor
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
