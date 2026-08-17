import Link from "next/link";
import { ArrowUpRight, Check, MonitorSmartphone } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/admin/auth";
import {
  AVAILABLE_STOREFRONT_THEMES,
  resolveStorefrontThemeTokens,
} from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { cn } from "@/lib/utils";
import { ScaledThemePreview } from "./ScaledThemePreview";

export const dynamic = "force-dynamic";

export default async function ThemesAdminPage() {
  await requireRole(["admin"]);
  const published = await readCurrentPublishedStorefrontTheme();
  const publishedPrimary = resolveStorefrontThemeTokens(published.config)
    .palette.primary;

  return (
    <div>
      <PageHeader
        title="Storefront themes"
        description="Explore live responsive storefronts, customize their brand color, and publish the best fit."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {AVAILABLE_STOREFRONT_THEMES.map((theme) => {
          const selected = theme.id === published.config.themeId;
          const primary = selected
            ? publishedPrimary
            : theme.defaultTokens.palette.primary;
          const previewUrl = `/admin/theme-component-preview/${theme.id}?primary=${encodeURIComponent(primary)}`;

          return (
            <article
              key={theme.id}
              className={cn(
                "group relative overflow-hidden rounded-md border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl",
                selected
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-border",
              )}
            >
              <Link
                href={`/admin/themes/${theme.id}`}
                aria-label={`Open ${theme.displayName} theme`}
                className="absolute inset-0 z-20 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="sr-only">Open {theme.displayName}</span>
              </Link>

              <div className="border-b border-border bg-muted/40 p-2.5">
                <div className="overflow-hidden rounded-sm border border-border bg-background shadow-inner">
                  <div className="flex h-8 items-center gap-1.5 border-b border-border bg-muted/70 px-3">
                    <span className="size-2 rounded-full bg-red-400" />
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span className="size-2 rounded-full bg-green-400" />
                    <span className="ml-2 flex-1 truncate rounded-sm border border-border/70 bg-background/80 px-2 font-mono text-[9px] leading-4 text-muted-foreground">
                      {theme.id}.storefront.preview
                    </span>
                    <MonitorSmartphone className="ml-1 size-3.5 text-muted-foreground" />
                  </div>
                  <div className="relative overflow-hidden bg-[#050505]">
                    <ScaledThemePreview
                      viewport="desktop"
                      title={`${theme.displayName} scaled desktop component preview`}
                      src={previewUrl}
                      loading="lazy"
                      interactive={false}
                    />
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
                      <Badge
                        variant="secondary"
                        className="border border-white/10 bg-black/70 text-white shadow-sm backdrop-blur"
                      >
                        Live components
                      </Badge>
                      {selected ? (
                        <Badge variant="success" className="shadow-sm">
                          <Check className="mr-1 size-3" /> Published
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {theme.category}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
                      {theme.displayName}
                    </h2>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>

                <p className="mt-3 min-h-10 text-sm leading-5 text-muted-foreground">
                  {theme.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: primary }}
                    />
                    {primary.toUpperCase()}
                  </span>
                  <span>
                    {theme.slots.homepage.sectionTypes.length} homepage sections
                  </span>
                  <span>Responsive preview</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
