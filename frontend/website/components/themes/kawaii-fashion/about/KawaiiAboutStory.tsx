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
      className="relative overflow-hidden bg-background py-16 text-foreground sm:py-24 lg:py-32"
      aria-labelledby={headingText ? headingId : undefined}
    >
      <div
        className="pointer-events-none absolute -left-24 bottom-1/4 size-72 rounded-[9999px] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 xl:gap-24">
        {imageUrl ? (
          <figure className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden border border-border bg-surface sm:aspect-[5/6]">
              <Image
                src={imageUrl}
                alt={imageAlt || ""}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </figure>
        ) : null}

        <div className={imageUrl ? "lg:pt-0" : "mx-auto w-full max-w-3xl"}>
          {eyebrow ? (
            <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
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
          {paragraphs.length > 0 ? (
            <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
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
            <blockquote className="mt-8 border-l-2 border-primary bg-surface px-5 py-4 font-display text-xl font-medium leading-relaxed sm:text-2xl">
              {extra}
            </blockquote>
          ) : null}
        </div>
      </div>
    </section>
  );
}
