import { useId } from "react";
import { Sparkles } from "lucide-react";
import {
  configString,
  parseValues,
} from "@/components/AboutPage/V2/aboutV2Config";
import type { KawaiiAboutRendererProps } from "./types";

export default function KawaiiAboutValues({
  config,
}: KawaiiAboutRendererProps) {
  const headingId = useId();
  const eyebrow = configString(config, "eyebrow");
  const title = configString(config, "title");
  const accessibleLabel = configString(config, "accessible_label");
  const headingText = title || accessibleLabel || eyebrow;
  const values = parseValues(config);

  if (values.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-surface py-16 text-foreground sm:py-24 lg:py-32"
      aria-labelledby={headingText ? headingId : undefined}
    >
      <div
        className="pointer-events-none absolute -right-24 top-1/3 size-72 rounded-[9999px] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <span className="h-px w-7 bg-primary" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2
              id={headingId}
              className="text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-6xl"
            >
              {title}
            </h2>
          ) : headingText ? (
            <h2 id={headingId} className="sr-only">
              {headingText}
            </h2>
          ) : null}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-16 lg:gap-6">
          {values.map((value, index) => (
            <article
              key={`${value.title}-${index}`}
              className="group flex min-h-72 flex-col border border-border bg-card p-7 transition-colors hover:border-primary/45 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transition-none">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              {value.title ? (
                <h3 className="mt-10 font-display text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
                  {value.title}
                </h3>
              ) : null}
              {value.body ? (
                <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                  {value.body}
                </p>
              ) : null}
              <span
                className="mt-auto block h-px w-10 bg-primary pt-8 [background-clip:content-box] transition-all group-hover:w-20 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
