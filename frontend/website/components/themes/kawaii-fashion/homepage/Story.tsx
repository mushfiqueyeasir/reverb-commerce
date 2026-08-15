import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Layers,
  Scissors,
  Shirt,
  Sparkles,
  Zap,
} from "lucide-react";
import { safeKawaiiHref } from "@/components/themes/kawaii-fashion/safeHref";
import {
  parseHomepageStoryConfig,
  type StoryCardIcon,
} from "@/lib/cms/homepageStory";

interface KawaiiFashionStoryProps {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  config?: Record<string, unknown>;
  imageUrl?: string | null;
}

function configText(config: Record<string, unknown>, key: string) {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const STORY_ICONS = {
  layers: Layers,
  shirt: Shirt,
  scissors: Scissors,
  zap: Zap,
  sparkles: Sparkles,
  award: Award,
} satisfies Record<StoryCardIcon, typeof Layers>;

export default function KawaiiFashionStory({
  title,
  subtitle,
  body,
  eyebrow,
  ctaLabel,
  ctaHref,
  config,
  imageUrl,
}: KawaiiFashionStoryProps) {
  const rawConfig = config ?? {};
  const story = parseHomepageStoryConfig(rawConfig);
  const imageAlt = configText(rawConfig, "image_alt");
  const imageLabel = configText(rawConfig, "image_label");
  const imageValue = configText(rawConfig, "image_value");
  const normalizedTitle = title?.trim();
  const normalizedSubtitle = subtitle?.trim();
  const normalizedEyebrow =
    eyebrow?.trim() || configText(rawConfig, "copy_label");
  const normalizedCtaLabel = ctaLabel?.trim();
  const services = (Array.isArray(rawConfig.cards) ? story.cards : []).map(
    (card) => ({
      id: card.id,
      icon: STORY_ICONS[card.icon],
      label: card.label.trim(),
      detail: card.detail.trim(),
    }),
  );
  const hasFigure = Boolean(imageUrl || imageLabel || imageValue);
  const hasCopy = Boolean(
    normalizedTitle ||
    normalizedSubtitle ||
    body ||
    normalizedEyebrow ||
    normalizedCtaLabel ||
    services.length,
  );

  if (!hasFigure && !hasCopy) return null;

  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute left-0 top-1/3 h-64 w-64 -translate-x-1/2 rounded-[9999px] bg-primary/10 blur-3xl" />
      <div
        className={`relative mx-auto grid gap-10 px-4 sm:px-6 lg:items-center lg:px-10 ${
          hasFigure && hasCopy
            ? "max-w-[1600px] lg:grid-cols-2 lg:gap-16 xl:gap-24"
            : "max-w-3xl"
        }`}
      >
        {hasFigure ? (
          <figure className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden border border-border bg-surface sm:aspect-[5/6]">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={imageAlt || ""}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_26%,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_28%),linear-gradient(145deg,var(--card),var(--surface))]" />
              )}
            </div>
            {imageLabel || imageValue ? (
              <figcaption className="absolute -bottom-5 left-4 max-w-[80%] border border-border bg-card px-5 py-4 shadow-[0_18px_45px_color-mix(in_srgb,var(--foreground)_8%,transparent)] sm:-bottom-7 sm:left-7 sm:px-7 sm:py-5">
                {imageLabel ? (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {imageLabel}
                  </p>
                ) : null}
                {imageValue ? (
                  <p className="mt-1 font-display text-lg font-semibold text-foreground sm:text-xl">
                    {imageValue}
                  </p>
                ) : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {hasCopy ? (
          <div className="pt-5 lg:pt-0">
            {normalizedEyebrow ? (
              <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <span className="h-px w-7 bg-primary" aria-hidden="true" />
                {normalizedEyebrow}
              </p>
            ) : null}
            {normalizedTitle ? (
              <h2 className="max-w-[12ch] text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
                {normalizedTitle}
              </h2>
            ) : null}
            {normalizedSubtitle ? (
              <p className="mt-5 max-w-xl font-display text-xl font-medium leading-snug text-foreground sm:text-2xl">
                {normalizedSubtitle}
              </p>
            ) : null}
            {body ? (
              <div
                className="mt-5 max-w-xl space-y-4 text-sm leading-7 text-muted-foreground [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_h1]:text-2xl [&_h1]:text-foreground [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 sm:text-base"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : null}

            {services.length ? (
              <div className="mt-9 border-y border-border">
                {services.slice(0, 6).map((service, index) => {
                  const Icon = service.icon;
                  return (
                    <div
                      key={service.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-4 last:border-b-0 sm:gap-5 sm:py-5"
                    >
                      <span className="grid size-10 place-items-center bg-surface text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        {service.label ? (
                          <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">
                            {service.label}
                          </h3>
                        ) : null}
                        {service.detail ? (
                          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                            {service.detail}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {normalizedCtaLabel ? (
              <Link
                href={safeKawaiiHref(ctaHref, "/product")}
                className="group mt-8 inline-flex min-h-12 items-center gap-4 bg-primary px-6 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                {normalizedCtaLabel}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
