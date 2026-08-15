import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/admin/auth";
import {
  AVAILABLE_STOREFRONT_THEMES,
  resolveStorefrontThemeTokens,
} from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { cn } from "@/lib/utils";
import { ThemePreviewMockup } from "./ThemePreviewMockup";

export const dynamic = "force-dynamic";

export default async function ThemesAdminPage() {
  await requireRole(["admin"]);
  const published = await readCurrentPublishedStorefrontTheme();
  const publishedPrimary = resolveStorefrontThemeTokens(published.config)
    .palette.primary;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {AVAILABLE_STOREFRONT_THEMES.map((theme) => {
        const selected = theme.id === published.config.themeId;
        return (
          <Link
            key={theme.id}
            href={`/admin/themes/${theme.id}`}
            aria-label={`Open ${theme.displayName} theme`}
            className={cn(
              "group overflow-hidden rounded-md border border-border bg-card p-2 transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "border-primary ring-1 ring-primary/25",
            )}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-border bg-background">
              {theme.id === "legacy-classic" ? (
                <Image
                  src="/images/themes/legacy-classic/desktop.png"
                  alt="Legacy Classic landing page preview"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover object-top transition duration-300 group-hover:scale-[1.01]"
                />
              ) : (
                <ThemePreviewMockup
                  themeId={theme.id}
                  primary={
                    selected
                      ? publishedPrimary
                      : theme.defaultTokens.palette.primary
                  }
                  viewport="phone"
                  className="h-full w-full transition duration-300 group-hover:scale-[1.01]"
                />
              )}
            </div>
            <div className="flex min-h-12 items-center justify-between gap-2 px-2 py-2">
              <span className="font-display font-semibold text-foreground">
                {theme.displayName}
              </span>
              {selected ? (
                <Badge variant="success">
                  <Check className="mr-1 size-3" /> Selected
                </Badge>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
