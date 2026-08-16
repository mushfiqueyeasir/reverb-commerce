import Image from "next/image";
import Link from "next/link";
import { Award, Layers, Scissors, Shirt, Sparkles, Zap } from "lucide-react";
import {
  parseHomepageStoryConfig,
  type StoryCardIcon,
} from "@/lib/cms/homepageStory";

interface RichTextSectionProps {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  config?: Record<string, unknown>;
  imageUrl?: string | null;
}

const STORY_ICONS = {
  layers: Layers,
  shirt: Shirt,
  scissors: Scissors,
  zap: Zap,
  sparkles: Sparkles,
  award: Award,
} satisfies Record<StoryCardIcon, typeof Layers>;

export default function RichTextSection({
  title,
  subtitle,
  body,
  eyebrow,
  ctaLabel,
  ctaHref,
  config,
  imageUrl,
}: RichTextSectionProps) {
  if (!title && !subtitle && !body) return null;
  const story = parseHomepageStoryConfig(config);

  if (story.layout === "feature") {
    return (
      <section className="relative overflow-hidden py-24 md:py-40">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <div
            className={`grid gap-10 lg:gap-20 ${imageUrl ? "lg:grid-cols-2" : ""}`}
          >
            {imageUrl ? (
              <div className="relative">
                <div className="relative aspect-[5/6] overflow-hidden rounded-3xl border border-border">
                  <Image
                    src={imageUrl}
                    alt={story.imageAlt || title || "Story image"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  {story.imageLabel || story.imageValue || story.imageTag ? (
                    <div className="glass absolute bottom-4 left-4 right-4 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 sm:bottom-6 sm:left-6 sm:right-6 sm:px-5 sm:py-4">
                      <div className="min-w-0">
                        {story.imageLabel ? (
                          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                            {story.imageLabel}
                          </div>
                        ) : null}
                        {story.imageValue ? (
                          <div className="mt-1 truncate font-display text-lg font-semibold sm:text-xl">
                            {story.imageValue}
                          </div>
                        ) : null}
                      </div>
                      {story.imageTag ? (
                        <div className="shrink-0 font-mono text-xs text-primary-readable">
                          {story.imageTag}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                <span className="h-px w-8 bg-primary" />
                {eyebrow || story.copyLabel || subtitle || "Our story"}
              </div>
              {title ? (
                <h2 className="font-display text-5xl font-bold leading-[0.9] tracking-tight md:text-6xl">
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p className="mt-5 max-w-md font-display text-xl font-semibold text-foreground/90">
                  {subtitle}
                </p>
              ) : null}
              {body ? (
                <div
                  className="prose prose-sm mt-6 max-w-md text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary-readable"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              ) : null}
              {story.cards.length ? (
                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {story.cards.map((card) => {
                    const Icon = STORY_ICONS[card.icon];
                    return (
                      <div
                        key={card.id}
                        className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-card/80"
                      >
                        <Icon className="h-5 w-5 text-primary-readable transition-transform group-hover:scale-110" />
                        <div className="mt-4 font-display text-lg font-semibold tracking-tight">
                          {card.label}
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {card.detail}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {ctaLabel ? (
                <Link
                  href={ctaHref || "/product"}
                  className="mt-8 inline-flex min-h-11 w-fit items-center rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary hover:text-primary-readable"
                >
                  {ctaLabel} →
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10">
      {eyebrow || subtitle ? (
        <span className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.28em] text-primary-readable">
          {eyebrow || subtitle}
        </span>
      ) : null}
      {title ? (
        <h2 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          {title}
        </h2>
      ) : null}
      {body ? (
        <div
          className="prose prose-sm mx-auto mt-5 max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary-readable md:prose-base"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : null}
      {ctaLabel ? (
        <Link
          href={ctaHref || "/product"}
          className="mt-7 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary hover:text-primary-readable"
        >
          {ctaLabel} →
        </Link>
      ) : null}
    </section>
  );
}
