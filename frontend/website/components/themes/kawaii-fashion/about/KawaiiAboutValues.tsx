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
  const values = parseValues(config);

  if (values.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden border-y border-border bg-surface py-20 text-foreground sm:py-28 lg:py-32"
      aria-labelledby={headingId}
    >
      <div
        className="absolute -right-24 -top-24 size-80 rounded-full bg-[color-mix(in_srgb,var(--surface)_55%,#cfc2ff)] opacity-70 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2
              id={headingId}
              className="mt-4 text-balance font-display text-[clamp(2.75rem,6vw,6rem)] font-semibold leading-[0.92] tracking-[-0.05em]"
            >
              {title}
            </h2>
          ) : (
            <h2 id={headingId} className="sr-only">
              {eyebrow || "Our values"}
            </h2>
          )}
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-16">
          {values.map((value, index) => (
            <li
              key={`${value.title}-${index}`}
              className="group flex min-h-72 flex-col rounded-md border border-border bg-card p-7 transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_20px_50px_rgb(var(--foreground-rgb)/0.07)] sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-12 font-display text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
                {value.title || `Value ${index + 1}`}
              </h3>
              {value.body ? (
                <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                  {value.body}
                </p>
              ) : null}
              <span
                className="mt-auto block h-px w-12 bg-primary pt-8 [background-clip:content-box] transition-all group-hover:w-20"
                aria-hidden="true"
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
