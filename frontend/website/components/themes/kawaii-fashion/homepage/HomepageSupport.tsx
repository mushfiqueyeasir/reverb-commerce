import Link from "next/link";
import {
  Headphones,
  Mail,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";

const SERVICES = [
  {
    title: "Carefully packed",
    text: "Prepared with attention, from us to you.",
    icon: PackageCheck,
  },
  {
    title: "Secure checkout",
    text: "A simple and protected shopping experience.",
    icon: ShieldCheck,
  },
  {
    title: "Here to help",
    text: "Friendly support before and after your order.",
    icon: Headphones,
  },
];

export default function KawaiiFashionHomepageSupport({
  contactHref = "/contact-us",
}: {
  contactHref?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-background px-5 pb-16 pt-6 sm:px-6 sm:pb-24 lg:px-10 lg:pb-32">
      <div className="pointer-events-none absolute bottom-0 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1500px] space-y-8 sm:space-y-10">
        <section
          aria-label="Shopping guarantees"
          className="grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_70px_color-mix(in_srgb,var(--foreground)_6%,transparent)] sm:grid-cols-3"
        >
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
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
                    {service.title}
                  </h2>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    {service.text}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section
          aria-labelledby="kawaii-studio-notes-title"
          className="relative isolate overflow-hidden rounded-[2rem] border border-primary/20 bg-surface px-6 py-10 sm:px-10 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:px-14 lg:py-14"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-primary/15 blur-3xl" />
          <Sparkles
            className="pointer-events-none absolute right-8 top-8 size-8 rotate-12 text-primary/25 sm:right-12 sm:top-10"
            aria-hidden="true"
          />
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              Notes from the studio
            </p>
            <h2
              id="kawaii-studio-notes-title"
              className="mt-4 text-balance font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl lg:text-5xl"
            >
              New edits, style stories, and lovely little surprises.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Join our list to hear about fresh arrivals and special
              collections.
            </p>
          </div>
          <Link
            href={safeKawaiiHref(contactHref, "/contact-us")}
            className="group mt-8 inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-surface motion-reduce:transition-none lg:mt-0"
          >
            <Mail className="size-4" aria-hidden="true" />
            Join our list
          </Link>
        </section>
      </div>
    </div>
  );
}
