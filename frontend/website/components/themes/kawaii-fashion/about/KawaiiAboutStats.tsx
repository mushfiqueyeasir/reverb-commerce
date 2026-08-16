import { useId } from "react";
import {
  configString,
  parseStats,
} from "@/components/AboutPage/V2/aboutV2Config";
import type { KawaiiAboutRendererProps } from "./types";

export default function KawaiiAboutStats({ config }: KawaiiAboutRendererProps) {
  const headingId = useId();
  const accessibleLabel = configString(config, "accessible_label");
  const items = parseStats(config);

  if (items.length === 0) return null;

  return (
    <section
      className="bg-surface py-16 text-foreground sm:py-24"
      aria-labelledby={accessibleLabel ? headingId : undefined}
    >
      {accessibleLabel ? (
        <h2 id={headingId} className="sr-only">
          {accessibleLabel}
        </h2>
      ) : null}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <dl className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={`${item.label}-${item.value}-${index}`}
              className="flex min-h-40 flex-col justify-between gap-6 bg-card p-6 sm:min-h-44 sm:p-8"
            >
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {item.label || String(index + 1).padStart(2, "0")}
              </dt>
              <dd className="break-words font-display text-[clamp(1.5rem,4vw,3rem)] font-semibold leading-none tracking-[-0.05em] text-foreground">
                {item.value}
              </dd>
              <span className="h-px w-8 bg-primary" aria-hidden="true" />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}