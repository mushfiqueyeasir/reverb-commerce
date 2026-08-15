import { useId } from "react";
import { parseStats } from "@/components/AboutPage/V2/aboutV2Config";
import type { KawaiiAboutRendererProps } from "./types";

export default function KawaiiAboutStats({ config }: KawaiiAboutRendererProps) {
  const headingId = useId();
  const items = parseStats(config);

  if (items.length === 0) return null;

  return (
    <section
      className="border-y border-border bg-card py-12 text-foreground sm:py-16"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="sr-only">
        Highlights
      </h2>
      <dl className="mx-auto grid max-w-[1500px] grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${item.value}-${index}`}
            className={`flex min-h-40 flex-col justify-between gap-6 p-5 sm:min-h-48 sm:p-8 ${index % 2 === 0 ? "bg-surface" : "bg-[color-mix(in_srgb,var(--surface)_72%,#e2d9ff)]"}`}
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {item.label || `Highlight ${index + 1}`}
            </dt>
            <dd className="break-words font-display text-[clamp(1.75rem,4vw,3.75rem)] font-semibold leading-none tracking-[-0.04em] text-foreground">
              {item.value}
            </dd>
            <span className="h-px w-10 bg-primary" aria-hidden="true" />
          </div>
        ))}
      </dl>
    </section>
  );
}
