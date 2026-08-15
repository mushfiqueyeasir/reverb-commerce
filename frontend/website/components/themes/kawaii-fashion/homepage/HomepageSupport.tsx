import Link from "next/link";
import {
  Headphones,
  Mail,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";

const GUARANTEE_ICONS = [PackageCheck, ShieldCheck, Headphones] as const;

export interface KawaiiFashionGuaranteesProps {
  accessibleLabel: string;
  items: readonly [
    { title: string; body: string },
    { title: string; body: string },
    { title: string; body: string },
  ];
}

export function KawaiiFashionGuarantees({
  accessibleLabel,
  items,
}: KawaiiFashionGuaranteesProps) {
  return (
    <div className="relative overflow-hidden bg-background px-4 pb-16 pt-6 sm:px-6 sm:pb-24 lg:px-10 lg:pb-32">
      <section
        aria-label={accessibleLabel}
        className="relative mx-auto grid max-w-[1520px] overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3"
      >
        {items.map((item, index) => {
          const Icon = GUARANTEE_ICONS[index];
          return (
            <div
              key={`${index}-${item.title}`}
              className="group relative flex min-h-44 flex-col justify-between border-b border-border p-6 last:border-b-0 sm:min-h-52 sm:border-b-0 sm:border-r sm:p-8 sm:last:border-r-0 lg:p-10"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transition-none">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-display text-xs font-semibold tracking-[0.18em] text-primary/70">
                  0{index + 1}
                </span>
              </div>
              <div className="mt-8">
                <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                  {item.title}
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export interface KawaiiFashionStudioNotesProps {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export function KawaiiFashionStudioNotes({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
}: KawaiiFashionStudioNotesProps) {
  return (
    <div className="relative overflow-hidden bg-background px-4 pb-16 pt-4 sm:px-6 sm:pb-24 sm:pt-5 lg:px-10 lg:pb-32">
      <div className="pointer-events-none absolute bottom-0 left-1/2 size-80 -translate-x-1/2 rounded-[9999px] bg-primary/10 blur-3xl" />
      <section
        aria-labelledby="kawaii-studio-notes-title"
        className="relative isolate mx-auto max-w-[1520px] overflow-hidden rounded-2xl border border-primary/20 bg-surface px-6 py-10 sm:px-10 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:px-14 lg:py-14"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-[9999px] bg-primary/15 blur-3xl" />
        <Sparkles
          className="pointer-events-none absolute right-8 top-8 size-8 rotate-12 text-primary/25 sm:right-12 sm:top-10"
          aria-hidden="true"
        />
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {eyebrow}
          </p>
          <h2
            id="kawaii-studio-notes-title"
            className="mt-4 text-balance font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl lg:text-5xl"
          >
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {body}
          </p>
        </div>
        <Link
          href={safeKawaiiHref(ctaHref, "/")}
          className="group mt-8 inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface motion-reduce:transition-none lg:mt-0"
        >
          <Mail className="size-4" aria-hidden="true" />
          {ctaLabel}
        </Link>
      </section>
    </div>
  );
}
