import { Fragment } from "react";
import { sanitizeCmsHtml } from "@/lib/html/sanitize";
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
  type LucideIcon,
} from "lucide-react";
import AboutCraftV2 from "@/components/AboutPage/V2/AboutCraftV2";
import AboutCtaV2 from "@/components/AboutPage/V2/AboutCtaV2";
import AboutHeroV2 from "@/components/AboutPage/V2/AboutHeroV2";
import AboutStatsV2 from "@/components/AboutPage/V2/AboutStatsV2";
import AboutStoryV2 from "@/components/AboutPage/V2/AboutStoryV2";
import AboutValuesV2 from "@/components/AboutPage/V2/AboutValuesV2";
import type {
  AboutSectionRenderer,
  AboutSectionRendererProps,
} from "@/components/themes/types";
import {
  getAboutSectionFamily,
  type AboutCraftItem,
  type AboutSectionRow,
  type AboutStatItem,
  type AboutValueItem,
} from "@/lib/cms/aboutSections";
import {
  createAboutRendererRegistry,
  resolveAboutRenderer,
  type AboutRendererIdMapping,
  type AboutRendererRegistry,
} from "@/lib/cms/aboutRendererRegistry";

const CRAFT_ICONS: Record<string, LucideIcon> = {
  Layers,
  Shirt,
  Scissors,
  Zap,
  Sparkles,
  Award,
};

function cfgStr(config: Record<string, unknown>, key: string, fallback = "") {
  const v = config[key];
  return typeof v === "string" ? v : fallback;
}

function asStats(config: Record<string, unknown>): AboutStatItem[] {
  const raw = config.items;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      return {
        label: typeof o.label === "string" ? o.label : "",
        value: typeof o.value === "string" ? o.value : "",
      };
    })
    .filter((x): x is AboutStatItem => Boolean(x && (x.label || x.value)));
}

function asValues(config: Record<string, unknown>): AboutValueItem[] {
  const raw = config.items;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      return {
        title: typeof o.title === "string" ? o.title : "",
        body: typeof o.body === "string" ? o.body : "",
      };
    })
    .filter((x): x is AboutValueItem => Boolean(x && (x.title || x.body)));
}

function asCraft(config: Record<string, unknown>): AboutCraftItem[] {
  const raw = config.items;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      return {
        label: typeof o.label === "string" ? o.label : "",
        sub: typeof o.sub === "string" ? o.sub : "",
        icon: typeof o.icon === "string" ? o.icon : "Layers",
      };
    })
    .filter((x): x is AboutCraftItem => Boolean(x && x.label));
}

function HeroSection({
  config,
  imageUrl,
  headingLevel = "h1",
}: {
  config: Record<string, unknown>;
  imageUrl?: string | null;
  headingLevel?: "h1" | "h2";
}) {
  const heroUrl = imageUrl;
  const line1 = cfgStr(config, "headline_line1", "Designed with purpose.");
  const line2 = cfgStr(config, "headline_line2", "Made for everyday life.");
  const Heading = headingLevel;

  return (
    <section className="relative isolate min-h-[72vh] overflow-hidden md:min-h-[80vh]">
      {heroUrl ? (
        <Image
          src={heroUrl}
          alt="Store collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-primary/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-[1600px] flex-col justify-end px-6 pb-16 pt-28 md:min-h-[80vh] md:px-10 md:pb-24 md:pt-32">
        {cfgStr(config, "eyebrow") ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
            {cfgStr(config, "eyebrow")}
          </p>
        ) : null}
        <Heading className="mt-3 max-w-3xl font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.04em] text-foreground">
          {line1}
          {line2 ? (
            <>
              <br />
              <span className="text-primary">{line2}</span>
            </>
          ) : null}
        </Heading>
        {cfgStr(config, "subtitle") ? (
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {cfgStr(config, "subtitle")}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {cfgStr(config, "cta_primary_label") ? (
            <Link
              href={cfgStr(config, "cta_primary_url", "/product")}
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-background transition hover:pl-7 hover:pr-5"
            >
              {cfgStr(config, "cta_primary_label")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : null}
          {cfgStr(config, "cta_secondary_label") ? (
            <Link
              href={cfgStr(config, "cta_secondary_url", "/contact-us")}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-primary hover:text-primary"
            >
              {cfgStr(config, "cta_secondary_label")}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StatsSection({ config }: { config: Record<string, unknown> }) {
  const items = asStats(config);
  if (!items.length) return null;
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px md:grid-cols-4">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="px-6 py-8 text-center md:px-10 md:py-10"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StorySection({
  config,
  imageUrl,
}: {
  config: Record<string, unknown>;
  imageUrl?: string | null;
}) {
  const lifestyleUrl = imageUrl;
  const bodyHtml = cfgStr(config, "body_html");
  const extra = cfgStr(config, "extra");

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28">
      <div
        className={`grid items-center gap-12 lg:gap-20 ${lifestyleUrl ? "lg:grid-cols-2" : ""}`}
      >
        {lifestyleUrl ? (
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border">
            <Image
              src={lifestyleUrl}
              alt="Store story"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
          </div>
        ) : null}

        <div>
          {cfgStr(config, "eyebrow") ? (
            <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" />
              {cfgStr(config, "eyebrow")}
            </div>
          ) : null}
          {cfgStr(config, "title") ? (
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              {cfgStr(config, "title")}
            </h2>
          ) : null}
          {bodyHtml ? (
            <div
              className="prose prose-invert mt-6 max-w-none text-muted-foreground prose-p:leading-relaxed prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(bodyHtml) }}
            />
          ) : null}
          {extra ? (
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              {extra}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ValuesSection({ config }: { config: Record<string, unknown> }) {
  const values = asValues(config);
  if (!values.length) return null;
  return (
    <section className="border-y border-border bg-card/30 py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="max-w-2xl">
          {cfgStr(config, "eyebrow") ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
              {cfgStr(config, "eyebrow")}
            </p>
          ) : null}
          {cfgStr(config, "title") ? (
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              {cfgStr(config, "title")}
            </h2>
          ) : null}
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-3xl border border-border bg-background/60 p-7 transition hover:border-primary/40"
            >
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {value.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                {value.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CraftSection({
  config,
  imageUrl,
}: {
  config: Record<string, unknown>;
  imageUrl?: string | null;
}) {
  const fabricUrl = imageUrl;
  const craft = asCraft(config);

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28">
      <div
        className={`grid items-center gap-12 lg:gap-20 ${fabricUrl ? "lg:grid-cols-2" : ""}`}
      >
        <div className="order-2 lg:order-1">
          {cfgStr(config, "eyebrow") ? (
            <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" />
              {cfgStr(config, "eyebrow")}
            </div>
          ) : null}
          <h2 className="font-display text-4xl font-bold leading-[0.95] tracking-tight md:text-5xl">
            {cfgStr(config, "title_line1", "Every thread")}
            <br />
            {cfgStr(config, "title_line2", "engineered.")}
          </h2>
          {cfgStr(config, "body") ? (
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              {cfgStr(config, "body")}
            </p>
          ) : null}
          {craft.length ? (
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {craft.map((item) => {
                const Icon = CRAFT_ICONS[item.icon] ?? Layers;
                return (
                  <div
                    key={item.label}
                    className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
                  >
                    <Icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    <div className="mt-4 font-display text-lg font-semibold tracking-tight">
                      {item.label}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {item.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {fabricUrl ? (
          <div className="relative order-1 aspect-[5/6] overflow-hidden rounded-3xl border border-border lg:order-2">
            <Image
              src={fabricUrl}
              alt={cfgStr(config, "fabric_value", "Product detail")}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            <div className="glass absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl px-5 py-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {cfgStr(config, "fabric_label", "Product")}
                </div>
                <div className="mt-1 font-display text-xl font-semibold">
                  {cfgStr(config, "fabric_value", "Update this detail")}
                </div>
              </div>
              <div className="font-mono text-xs text-primary">
                {cfgStr(config, "fabric_tag", "// DETAIL")}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CtaSection({ config }: { config: Record<string, unknown> }) {
  const eyebrow = cfgStr(config, "eyebrow");
  const title = cfgStr(config, "title");
  const body = cfgStr(config, "body");

  return (
    <section className="mx-auto max-w-[1600px] px-6 pt-4 md:px-10 md:pt-8">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-primary/25 bg-card text-foreground shadow-[0_35px_100px_-55px_rgb(var(--primary-rgb)/0.7)] md:rounded-[2.75rem]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            background:
              "linear-gradient(rgb(var(--primary-rgb) / 0.65) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--primary-rgb) / 0.65) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full blur-3xl md:size-[28rem]"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--primary-rgb) / 0.45) 0%, transparent 68%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-[42%] hidden font-display text-[12rem] font-black leading-none tracking-[-0.08em] text-primary/[0.055] lg:block"
          aria-hidden
        >
          JOIN
        </div>

        <div className="relative grid lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="px-7 py-12 sm:px-10 md:px-14 md:py-16 lg:px-16 lg:py-20">
            {eyebrow ? (
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-primary sm:text-[11px]">
                <span className="size-2 rounded-full bg-primary shadow-[0_0_18px_rgb(var(--primary-rgb)/0.9)]" />
                {eyebrow}
                <span className="h-px w-12 bg-primary/45" />
              </div>
            ) : null}
            {title ? (
              <h2 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,6vw,5.75rem)] font-bold leading-[0.9] tracking-[-0.055em] text-foreground">
                {title}
              </h2>
            ) : null}
            {body ? (
              <p className="mt-7 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 md:text-lg">
                {body}
              </p>
            ) : null}

            <div className="mt-10 flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/70 sm:text-[10px]">
              <span>Built for motion</span>
              <span className="h-px flex-1 bg-border" />
              <span>ST / 04</span>
            </div>
          </div>

          <div className="relative flex flex-col justify-end border-t border-border bg-background/35 p-6 backdrop-blur-sm sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="mb-auto hidden lg:block">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Your next move
              </div>
              <div className="mt-4 h-px w-full bg-border" />
            </div>

            <div className="space-y-3">
              {cfgStr(config, "cta_primary_label") ? (
                <Link
                  href={cfgStr(config, "cta_primary_url", "/product")}
                  className="group flex min-h-16 items-center justify-between rounded-2xl bg-primary px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_18px_45px_-22px_rgb(var(--primary-rgb)/0.9)] sm:px-6 sm:text-[12px]"
                >
                  {cfgStr(config, "cta_primary_label")}
                  <span className="grid size-9 place-items-center rounded-full bg-primary-foreground/15 transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              ) : null}
              {cfgStr(config, "cta_secondary_label") ? (
                <Link
                  href={cfgStr(config, "cta_secondary_url", "/reviews")}
                  className="group flex min-h-14 items-center justify-between rounded-2xl border border-border px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/75 transition duration-300 hover:border-primary/60 hover:bg-primary/5 hover:text-primary sm:px-6 sm:text-[11px]"
                >
                  {cfgStr(config, "cta_secondary_label")}
                  <ArrowRight className="size-4 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroV1Renderer({
  config,
  imageUrl,
  headingLevel,
}: AboutSectionRendererProps) {
  return (
    <HeroSection
      config={config}
      imageUrl={imageUrl}
      headingLevel={headingLevel}
    />
  );
}

function StatsV1Renderer({ config }: AboutSectionRendererProps) {
  return <StatsSection config={config} />;
}

function StoryV1Renderer({ config, imageUrl }: AboutSectionRendererProps) {
  return <StorySection config={config} imageUrl={imageUrl} />;
}

function ValuesV1Renderer({ config }: AboutSectionRendererProps) {
  return <ValuesSection config={config} />;
}

function CraftV1Renderer({ config, imageUrl }: AboutSectionRendererProps) {
  return <CraftSection config={config} imageUrl={imageUrl} />;
}

function CtaV1Renderer({ config }: AboutSectionRendererProps) {
  return <CtaSection config={config} />;
}

function HeroV2Renderer({
  config,
  imageUrl,
  headingLevel,
  preview,
}: AboutSectionRendererProps) {
  return (
    <AboutHeroV2
      config={config}
      imageUrl={imageUrl}
      headingLevel={headingLevel}
      preview={preview}
    />
  );
}

function StatsV2Renderer({ config, preview }: AboutSectionRendererProps) {
  return <AboutStatsV2 config={config} preview={preview} />;
}

function StoryV2Renderer({
  config,
  imageUrl,
  preview,
}: AboutSectionRendererProps) {
  return <AboutStoryV2 config={config} imageUrl={imageUrl} preview={preview} />;
}

function ValuesV2Renderer({ config, preview }: AboutSectionRendererProps) {
  return <AboutValuesV2 config={config} preview={preview} />;
}

function CraftV2Renderer({
  config,
  imageUrl,
  preview,
}: AboutSectionRendererProps) {
  return <AboutCraftV2 config={config} imageUrl={imageUrl} preview={preview} />;
}

function CtaV2Renderer({ config, preview }: AboutSectionRendererProps) {
  return <AboutCtaV2 config={config} preview={preview} />;
}

export const SOURCE_ABOUT_RENDERERS = {
  "hero-v1": HeroV1Renderer,
  "stats-v1": StatsV1Renderer,
  "story-v1": StoryV1Renderer,
  "values-v1": ValuesV1Renderer,
  "craft-v1": CraftV1Renderer,
  "cta-v1": CtaV1Renderer,
  "hero-v2": HeroV2Renderer,
  "stats-v2": StatsV2Renderer,
  "story-v2": StoryV2Renderer,
  "values-v2": ValuesV2Renderer,
  "craft-v2": CraftV2Renderer,
  "cta-v2": CtaV2Renderer,
} satisfies AboutRendererRegistry<AboutSectionRenderer>;

function renderSection(
  section: AboutSectionRow,
  imageUrls: Partial<Record<string, string | null>>,
  preview: boolean,
  primaryHeroId: string | undefined,
  rendererMapping: AboutRendererIdMapping | undefined,
  renderers: Partial<AboutRendererRegistry<AboutSectionRenderer>> | undefined,
) {
  const registry = createAboutRendererRegistry<AboutSectionRenderer>(
    SOURCE_ABOUT_RENDERERS,
    renderers,
  );
  const Renderer = resolveAboutRenderer(section.type, registry, rendererMapping);
  if (!Renderer) return null;

  return (
    <Renderer
      config={section.config ?? {}}
      imageUrl={imageUrls[section.id]}
      preview={preview}
      headingLevel={section.id === primaryHeroId ? "h1" : "h2"}
    />
  );
}

export default function AboutPageScreen({
  sections,
  imageUrls = {},
  preview = false,
  rendererMapping,
  renderers,
}: {
  sections: AboutSectionRow[];
  imageUrls?: Partial<Record<string, string | null>>;
  preview?: boolean;
  rendererMapping?: AboutRendererIdMapping;
  renderers?: Partial<AboutRendererRegistry<AboutSectionRenderer>>;
}) {
  const primaryHeroId = sections.find(
    (section) => getAboutSectionFamily(section.type) === "hero",
  )?.id;

  return (
    <div className="pb-24">
      {sections.map((section) => (
        <Fragment key={section.id}>
          {renderSection(
            section,
            imageUrls,
            preview,
            primaryHeroId,
            rendererMapping,
            renderers,
          )}
        </Fragment>
      ))}
    </div>
  );
}
