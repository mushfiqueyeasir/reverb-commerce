"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Palette, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { STOREFRONT_THEME_REGISTRY } from "@/lib/theme/manifest";
import { applyStorefrontTheme } from "./actions";
import { ScaledThemePreview } from "./ScaledThemePreview";

const PRIMARY_PRESETS = [
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
];

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function ThemeWorkspace({
  themeId,
  themeName,
  initialPrimary,
  expectedVersion,
  isPublished,
}: {
  themeId: string;
  themeName: string;
  initialPrimary: string;
  expectedVersion: number;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [primary, setPrimary] = useState(initialPrimary.toUpperCase());
  const [pending, startTransition] = useTransition();
  const validPrimary = isHexColor(primary);
  const resolvedPrimary = validPrimary ? primary : initialPrimary;
  const colorChanged =
    resolvedPrimary.toLowerCase() !== initialPrimary.toLowerCase();
  const hasChanges = !isPublished || colorChanged;
  const previewUrl = `/admin/theme-component-preview/${themeId}?primary=${encodeURIComponent(resolvedPrimary)}`;
  const browserAddress =
    STOREFRONT_THEME_REGISTRY[themeId]?.admin.browserAddress ?? "teedrop.store";

  const applyTheme = () => {
    startTransition(async () => {
      const result = await applyStorefrontTheme({
        themeId,
        primary: resolvedPrimary,
        expectedVersion,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${themeName} applied`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-background text-primary">
            <Palette className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Brand color
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Choose the accent used for buttons, links, badges, and highlights.
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-[72px_minmax(0,240px)] sm:items-end">
              <label className="space-y-2">
                <span className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Picker
                </span>
                <span
                  className="relative block h-11 cursor-pointer overflow-hidden rounded-md border border-input shadow-sm"
                  style={{ backgroundColor: resolvedPrimary }}
                >
                  <input
                    type="color"
                    name="primary-picker"
                    aria-label="Choose primary color"
                    value={resolvedPrimary}
                    onChange={(event) =>
                      setPrimary(event.target.value.toUpperCase())
                    }
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </span>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Hex value
                </span>
                <span className="flex h-11 items-center border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                  <span className="mr-2 size-2 rounded-full bg-primary" />
                  <input
                    type="text"
                    name="primary"
                    value={primary}
                    maxLength={7}
                    spellCheck={false}
                    aria-invalid={!validPrimary}
                    onChange={(event) =>
                      setPrimary(event.target.value.toUpperCase())
                    }
                    className="min-w-0 flex-1 bg-transparent font-mono text-sm font-medium uppercase text-foreground outline-none"
                  />
                </span>
              </label>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Quick colors
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRIMARY_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use ${color}`}
                    aria-pressed={resolvedPrimary.toLowerCase() === color}
                    onClick={() => setPrimary(color.toUpperCase())}
                    className="grid size-9 place-items-center rounded-md border border-border bg-background transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className="size-5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {!validPrimary ? (
              <p className="text-sm text-destructive">
                Enter a complete six-digit hex color, such as #DC2626.
              </p>
            ) : null}
          </div>

          <div className="border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Live accent
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                  {resolvedPrimary.toUpperCase()}
                </p>
              </div>
              <span
                className="size-10 rounded-md shadow-sm ring-1 ring-black/10"
                style={{ backgroundColor: resolvedPrimary }}
              />
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <Button
                type="button"
                disabled={
                  pending || !validPrimary || !hasChanges || expectedVersion < 1
                }
                onClick={applyTheme}
              >
                {pending ? <Loader2 className="animate-spin" /> : <Check />}
                Apply theme
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Reset primary color"
                disabled={!colorChanged || pending}
                onClick={() => setPrimary(initialPrimary.toUpperCase())}
              >
                <RotateCcw />
              </Button>
            </div>
          </div>
        </div>

        {expectedVersion < 1 ? (
          <p className="border-t border-border px-5 py-3 text-sm text-destructive">
            Theme storage is unavailable. Apply the storefront theme migration
            and retry.
          </p>
        ) : null}
      </section>

      <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_410px]">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Web storefront</p>
          <div className="overflow-hidden rounded-[6px] border border-border bg-background shadow-sm">
            <div className="flex h-9 items-center gap-1.5 border-b border-border bg-muted/60 px-3">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-green-400" />
              <div className="ml-3 h-5 flex-1 border border-border bg-background/80 px-3 font-mono text-[8px] leading-5 text-muted-foreground">
                {browserAddress}
              </div>
            </div>
            <ScaledThemePreview
              viewport="desktop"
              title={`${themeName} desktop storefront preview`}
              src={previewUrl}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-center text-sm font-medium text-foreground">
            Phone storefront
          </p>
          <div className="relative mx-auto w-full max-w-[390px] rounded-[46px] bg-[#050505] p-[9px] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
            <span className="absolute -left-[3px] top-28 h-14 w-[3px] rounded-l-sm bg-[#1d1d1d]" />
            <span className="absolute -left-[3px] top-48 h-20 w-[3px] rounded-l-sm bg-[#1d1d1d]" />
            <span className="absolute -right-[3px] top-40 h-24 w-[3px] rounded-r-sm bg-[#1d1d1d]" />
            <div className="relative overflow-hidden rounded-[37px] bg-black ring-1 ring-white/10">
              <div className="pointer-events-none absolute left-1/2 top-2 z-20 flex h-6 w-24 -translate-x-1/2 items-center justify-end rounded-full bg-black px-2 shadow-lg">
                <span className="size-1.5 rounded-full bg-[#1e293b] ring-1 ring-white/10" />
              </div>
              <ScaledThemePreview
                viewport="phone"
                title={`${themeName} phone storefront preview`}
                src={previewUrl}
              />
              <div className="pointer-events-none absolute bottom-1 left-1/2 z-20 h-1 w-20 -translate-x-1/2 rounded-full bg-white/80" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
