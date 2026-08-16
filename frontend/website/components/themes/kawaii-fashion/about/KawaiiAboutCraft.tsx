import { useId } from "react";
import Image from "next/image";
import {
  Award,
  Layers,
  Scissors,
  Shirt,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  configString,
  parseCraft,
} from "@/components/AboutPage/V2/aboutV2Config";
import type { KawaiiAboutRendererProps } from "./types";

const craftIcons: Record<string, LucideIcon> = {
  Award,
  Layers,
  Scissors,
  Shirt,
  Sparkles,
  Zap,
};

export default function KawaiiAboutCraft({
  config,
  imageUrl,
}: KawaiiAboutRendererProps) {
  const headingId = useId();
  const eyebrow = configString(config, "eyebrow");
  const firstLine = configString(config, "title_line1");
  const secondLine = configString(config, "title_line2");
  const body = configString(config, "body");
  const accessibleLabel = configString(config, "accessible_label");
  const imageAlt = configString(config, "image_alt");
  const fabricLabel = configString(config, "fabric_label");
  const fabricValue = configString(config, "fabric_value");
  const fabricTag = configString(config, "fabric_tag");
  const items = parseCraft(config);
  const headingText =
    [firstLine, secondLine].filter(Boolean).join(" ") ||
    accessibleLabel ||
    eyebrow;

  if (
    !eyebrow &&
    !firstLine &&
    !secondLine &&
    !body &&
    !fabricLabel &&
    !fabricValue &&
    !fabricTag &&
    items.length === 0 &&
    !imageUrl
  ) {
    return null;
  }

  return (
    <section
      className="relative overflow-hidden bg-background py-16 text-foreground sm:py-24 lg:py-32"
      aria-labelledby={headingText ? headingId : undefined}
    >
      <div
        className="pointer-events-none absolute -left-24 top-1/3 size-72 rounded-[9999px] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 xl:gap-24">
        <div className="order-2 lg:order-1">
          {eyebrow ? (
            <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-readable">
              <span className="h-px w-7 bg-primary" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          {firstLine || secondLine ? (
            <h2
              id={headingId}
              className="text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-6xl"
            >
              {firstLine ? <span className="block">{firstLine}</span> : null}
              {secondLine ? (
                <span className="block font-normal italic text-primary-readable">
                  {secondLine}
                </span>
              ) : null}
            </h2>
          ) : headingText ? (
            <h2 id={headingId} className="sr-only">
              {headingText}
            </h2>
          ) : null}
          {body ? (
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {body}
            </p>
          ) : null}

          {items.length > 0 ? (
            <ul className="mt-10 space-y-0 border-y border-border">
              {items.map((item, index) => {
                const Icon = craftIcons[item.icon] || Layers;
                return (
                  <li
                    key={`${item.label}-${index}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-4 last:border-b-0 sm:gap-5 sm:py-5"
                  >
                    <span className="grid size-11 place-items-center rounded-2xl bg-surface text-primary-readable transition-transform group-hover:-rotate-3 motion-reduce:transition-none">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      {item.label ? (
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {item.label}
                        </h3>
                      ) : null}
                      {item.sub ? (
                        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                          {item.sub}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {imageUrl ? (
          <figure className="relative mx-auto order-1 w-full max-w-2xl lg:order-2 lg:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden border border-border bg-surface sm:aspect-[5/6]">
              <Image
                src={imageUrl}
                alt={imageAlt || ""}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {fabricLabel || fabricValue || fabricTag ? (
              <figcaption className="absolute -bottom-5 left-4 max-w-[85%] border border-border bg-card px-5 py-4 shadow-[0_18px_45px_color-mix(in_srgb,var(--foreground)_8%,transparent)] sm:-bottom-7 sm:left-7 sm:px-7 sm:py-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    {fabricLabel ? (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-readable">
                        {fabricLabel}
                      </p>
                    ) : null}
                    {fabricValue ? (
                      <p className="mt-1 font-display text-lg font-semibold text-foreground sm:text-xl">
                        {fabricValue}
                      </p>
                    ) : null}
                  </div>
                  {fabricTag ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {fabricTag}
                    </span>
                  ) : null}
                </div>
              </figcaption>
            ) : null}
          </figure>
        ) : null}
      </div>
    </section>
  );
}
