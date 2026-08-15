import { useId } from "react";
import Image from "next/image";
import {
  configString,
  htmlParagraphs,
} from "@/components/AboutPage/V2/aboutV2Config";
import type { KawaiiAboutRendererProps } from "./types";

export default function KawaiiAboutStory({
  config,
  imageUrl,
}: KawaiiAboutRendererProps) {
  const headingId = useId();
  const eyebrow = configString(config, "eyebrow");
  const title = configString(config, "title");
  const accessibleLabel = configString(config, "accessible_label");
  const imageAlt = configString(config, "image_alt");
  const paragraphs = htmlParagraphs(configString(config, "body_html"));
  const extra = configString(config, "extra");
  const headingText = title || accessibleLabel || eyebrow;

  if (!eyebrow && !title && paragraphs.length === 0 && !extra && !imageUrl) {
    return null;
  }

  return (
    <section
      className="relative overflow-hidden bg-background py-20 text-foreground sm:py-28 lg:py-36"
      aria-labelledby={headingText ? headingId : undefined}
    >
      <div
        className="absolute right-0 top-0 h-2/3 w-1/2 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--surface)_78%,#ddd4ff),transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-[1500px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-12">
        <div className="lg:col-span-7">
          <figure className="relative aspect-[5/4] overflow-hidden rounded-md border border-border bg-surface sm:aspect-[4/3]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt || ""}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_34%,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_25%),linear-gradient(135deg,var(--surface),var(--card))]" />
            )}
            <div
              className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/15 to-transparent"
              aria-hidden="true"
            />
          </figure>
        </div>

        <article className="relative lg:col-span-5 lg:-ml-16">
          <div className="rounded-md border border-border bg-card/95 p-7 shadow-[0_24px_70px_rgb(var(--foreground-rgb)/0.08)] backdrop-blur-sm sm:p-10 lg:p-12">
            {eyebrow ? (
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                <span className="h-px w-8 bg-primary" aria-hidden="true" />
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                id={headingId}
                className="mt-5 text-balance font-display text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.045em]"
              >
                {title}
              </h2>
            ) : headingText ? (
              <h2 id={headingId} className="sr-only">
                {headingText}
              </h2>
            ) : null}
            {paragraphs.length > 0 ? (
              <div className="mt-7 space-y-5 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                {paragraphs.map((paragraph, index) => (
                  <p
                    key={`${paragraph.slice(0, 36)}-${index}`}
                    className={index === 0 ? "text-foreground" : undefined}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            {extra ? (
              <blockquote className="mt-7 border-l-2 border-primary bg-surface px-5 py-4 font-display text-lg font-medium leading-relaxed sm:text-xl">
                {extra}
              </blockquote>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
