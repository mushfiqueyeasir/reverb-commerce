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
  const fabricLabel = configString(config, "fabric_label");
  const fabricValue = configString(config, "fabric_value");
  const fabricTag = configString(config, "fabric_tag");
  const items = parseCraft(config);
  const imageAlt =
    fabricValue || [firstLine, secondLine].filter(Boolean).join(" ");

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
      className="bg-background py-20 text-foreground sm:py-28 lg:py-36"
      aria-labelledby={headingId}
    >
      <div className="mx-auto grid max-w-[1500px] gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-12">
        <div>
          {eyebrow ? (
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <span className="h-px w-8 bg-primary" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          {firstLine || secondLine ? (
            <h2
              id={headingId}
              className="mt-5 font-display text-[clamp(2.75rem,6vw,6rem)] font-semibold leading-[0.9] tracking-[-0.05em]"
            >
              {firstLine ? <span className="block">{firstLine}</span> : null}
              {secondLine ? (
                <span className="block font-normal italic text-primary">
                  {secondLine}
                </span>
              ) : null}
            </h2>
          ) : (
            <h2 id={headingId} className="sr-only">
              {eyebrow || "Our craft"}
            </h2>
          )}
          {body ? (
            <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground">
              {body}
            </p>
          ) : null}

          {items.length > 0 ? (
            <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
              {items.map((item, index) => {
                const Icon = craftIcons[item.icon] || Layers;
                return (
                  <li
                    key={`${item.label}-${index}`}
                    className="min-h-40 bg-card p-5 transition-colors hover:bg-surface sm:p-6"
                  >
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <h3 className="mt-7 font-display text-lg font-semibold leading-tight">
                      {item.label || `Detail ${index + 1}`}
                    </h3>
                    {item.sub ? (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {item.sub}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <figure className="relative mx-auto aspect-[4/5] w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || "Product detail"}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_32%,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_27%),linear-gradient(145deg,color-mix(in_srgb,var(--surface)_72%,#ded5ff),var(--card))]" />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent"
            aria-hidden="true"
          />
          {fabricLabel || fabricValue || fabricTag ? (
            <figcaption className="absolute inset-x-4 bottom-4 rounded-sm border border-border bg-card/90 p-5 backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  {fabricLabel ? (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {fabricLabel}
                    </p>
                  ) : null}
                  {fabricValue ? (
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {fabricValue}
                    </p>
                  ) : null}
                </div>
                {fabricTag ? (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {fabricTag}
                  </span>
                ) : null}
              </div>
            </figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  );
}
