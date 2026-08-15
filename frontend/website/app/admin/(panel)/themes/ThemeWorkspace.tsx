"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { applyStorefrontTheme } from "./actions";
import {
  TeeDropMobileNavigation,
  TeeDropStorefrontPreview,
} from "./TeeDropStorefrontPreview";
import { ThemePreviewMockup } from "./ThemePreviewMockup";

export function ThemeWorkspace({
  themeId,
  themeName,
  initialPrimary,
  expectedVersion,
}: {
  themeId: string;
  themeName: string;
  initialPrimary: string;
  expectedVersion: number;
}) {
  const router = useRouter();
  const [primary, setPrimary] = useState(initialPrimary);
  const [pending, startTransition] = useTransition();

  const applyTheme = () => {
    startTransition(async () => {
      const result = await applyStorefrontTheme({
        themeId,
        primary,
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
      <section className="border-b border-border pb-6">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Primary color
        </h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="block w-full max-w-sm space-y-2">
            <span className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Primary
            </span>
            <span className="flex h-11 items-center gap-3 rounded-sm border border-input bg-background px-3">
              <input
                type="color"
                name="primary"
                value={primary}
                onChange={(event) => setPrimary(event.target.value)}
                className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-sm text-muted-foreground">
                {primary}
              </span>
            </span>
          </label>
          <Button
            type="button"
            size="lg"
            disabled={pending || expectedVersion < 1}
            onClick={applyTheme}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Apply theme
          </Button>
        </div>
        {expectedVersion < 1 ? (
          <p className="mt-3 text-sm text-destructive">
            Theme storage is unavailable. Apply the storefront theme migration
            and retry.
          </p>
        ) : null}
      </section>

      <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Web storefront</p>
          <div
            role="img"
            aria-label={`${themeName} desktop storefront mockup`}
            className="overflow-hidden rounded-[6px] border border-border bg-background shadow-sm"
          >
            <div className="flex h-9 items-center gap-1.5 border-b border-border bg-muted/60 px-3">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-green-400" />
              <div className="ml-3 h-5 flex-1 border border-border bg-background/80 px-3 font-mono text-[8px] leading-5 text-muted-foreground">
                teedrop.store
              </div>
            </div>
            <ScrollArea
              className="h-[min(72vh,720px)] bg-[#050505]"
              variant="brand"
            >
              {themeId === "legacy-classic" ? (
                <TeeDropStorefrontPreview primary={primary} device="desktop" />
              ) : (
                <div aria-hidden="true">
                  <ThemePreviewMockup
                    themeId={themeId}
                    primary={primary}
                    viewport="web"
                  />
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-center text-sm font-medium text-foreground">
            Phone storefront
          </p>
          <div className="relative mx-auto aspect-[9/19] w-full max-w-[300px] rounded-[38px] bg-[#050505] p-[8px] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
            <span className="absolute -left-[3px] top-28 h-14 w-[3px] rounded-l-sm bg-[#1d1d1d]" />
            <span className="absolute -left-[3px] top-48 h-20 w-[3px] rounded-l-sm bg-[#1d1d1d]" />
            <span className="absolute -right-[3px] top-40 h-24 w-[3px] rounded-r-sm bg-[#1d1d1d]" />
            <div
              role="img"
              aria-label={`${themeName} phone storefront mockup`}
              className="relative h-full overflow-hidden rounded-[30px] bg-black ring-1 ring-white/10"
            >
              <div className="pointer-events-none absolute left-1/2 top-2 z-20 flex h-6 w-24 -translate-x-1/2 items-center justify-end rounded-full bg-black px-2 shadow-lg">
                <span className="size-1.5 rounded-full bg-[#1e293b] ring-1 ring-white/10" />
              </div>
              <ScrollArea className="h-full bg-[#050505]" variant="brand">
                {themeId === "legacy-classic" ? (
                  <TeeDropStorefrontPreview primary={primary} device="phone" />
                ) : (
                  <div aria-hidden="true">
                    <ThemePreviewMockup
                      themeId={themeId}
                      primary={primary}
                      viewport="phone"
                    />
                  </div>
                )}
              </ScrollArea>
              {themeId === "legacy-classic" ? (
                <div className="absolute inset-x-0 bottom-0 z-10">
                  <TeeDropMobileNavigation primary={primary} />
                </div>
              ) : null}
              <div className="pointer-events-none absolute bottom-1 left-1/2 z-20 h-1 w-20 -translate-x-1/2 rounded-full bg-white/80" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
