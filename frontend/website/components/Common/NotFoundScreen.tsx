"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Home, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoreName } from "@/components/providers/StoreBrandProvider";

const PARTICLES = Array.from({ length: 12 });

type NotFoundScreenProps = {
  /**
   * `standalone` — full-viewport page (root / unmatched URLs, no store chrome).
   * `embedded` — content block inside the store layout (header + footer already shown).
   */
  variant?: "standalone" | "embedded";
  /** Defaults to storefront home + shop. */
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  footerNote?: string;
  className?: string;
};

export default function NotFoundScreen({
  variant = "standalone",
  primaryHref = "/",
  primaryLabel = "Back home",
  secondaryHref = "/product",
  secondaryLabel = "Shop collection",
  footerNote,
  className,
}: NotFoundScreenProps) {
  const standalone = variant === "standalone";
  const storeName = useStoreName();

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden",
        standalone
          ? "flex min-h-[100dvh] w-full items-center bg-background"
          : "mx-auto min-h-[70vh] max-w-[1400px] px-6 py-28 md:px-10 md:py-36",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-grid opacity-40",
          "[mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]",
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(70vh,560px)] w-[min(70vh,560px)] -translate-x-1/2 -translate-y-1/2 animate-spotlight rounded-full md:h-[720px] md:w-[720px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--primary-rgb) / 0.2) 0%, rgb(var(--primary-rgb) / 0.05) 40%, transparent 68%)",
        }}
        aria-hidden
      />
      {standalone ? (
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          {PARTICLES.map((_, i) => (
            <span
              key={i}
              className="absolute bottom-0 h-1 w-1 animate-particle rounded-full bg-primary/55"
              style={{
                left: `${(i * 8.3) % 100}%`,
                animationDuration: `${8 + (i % 5) * 2}s`,
                animationDelay: `${-i * 0.65}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 mx-auto w-full",
          standalone &&
            "flex min-h-[100dvh] max-w-[1400px] flex-col justify-between px-6 py-8 md:px-10 md:py-10",
        )}
      >
        {standalone ? (
          <Link
            href={primaryHref.startsWith("/admin") ? "/admin" : "/"}
            className="animate-hero-in inline-flex w-fit items-center"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              {storeName}
            </span>
          </Link>
        ) : null}

        <div
          className={cn(
            "flex flex-1 flex-col items-start justify-center",
            !standalone && "items-center text-center",
            standalone && "py-16 md:py-20",
          )}
        >
          <div
            className={cn(
              "inline-flex animate-hero-in items-center gap-3 rounded-full border border-border bg-card/60 px-3.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground backdrop-blur-md md:px-4 md:py-1.5 md:text-[11px]",
              !standalone && "mx-auto",
            )}
            style={{ animationDelay: "0.1s" }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Error 404
          </div>

          <p
            className={cn(
              "mt-6 animate-hero-in font-display text-[clamp(5.5rem,22vw,12rem)] font-bold leading-[0.8] tracking-[-0.06em] text-primary/25 text-glow-coral select-none",
              !standalone && "mx-auto",
            )}
            style={{ animationDelay: "0.16s" }}
            aria-hidden
          >
            404
          </p>

          <h1
            className={cn(
              "mt-2 max-w-xl animate-hero-in font-display text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[0.92] tracking-[-0.04em] text-foreground",
              !standalone && "mx-auto",
            )}
            style={{ animationDelay: "0.24s" }}
          >
            This drop
            <br />
            doesn&apos;t <span className="text-primary-readable">exist</span>
          </h1>

          <p
            className={cn(
              "mt-5 max-w-md animate-hero-in text-sm leading-relaxed text-muted-foreground md:text-base",
              !standalone && "mx-auto",
            )}
            style={{ animationDelay: "0.32s" }}
          >
            The page you&apos;re looking for may have moved, sold out, or never
            landed. Head back or keep exploring.
          </p>

          <div
            className={cn(
              "mt-8 flex animate-hero-in flex-wrap items-center gap-2.5 md:mt-10 md:gap-3",
              !standalone && "justify-center",
            )}
            style={{ animationDelay: "0.4s" }}
          >
            <Link
              href={primaryHref}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-foreground px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-background transition-all hover:bg-primary hover:pl-7 hover:pr-5 hover:text-primary-foreground md:px-8 md:py-3.5 md:text-[13px]"
            >
              <Home className="size-3.5 opacity-70" />
              {primaryLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={secondaryHref}
              className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-transparent px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-primary hover:text-primary-readable md:px-8 md:py-3.5 md:text-[13px]"
            >
              <ShoppingBag className="size-3.5 opacity-70" />
              {secondaryLabel}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {standalone ? (
          <div
            className="animate-float-up border-t border-border/80 pt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:text-[11px]"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{footerNote || `${storeName} · Page not found`}</span>
              <Link
                href="/contact-us"
                className="transition hover:text-primary-readable"
              >
                Need help?
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
