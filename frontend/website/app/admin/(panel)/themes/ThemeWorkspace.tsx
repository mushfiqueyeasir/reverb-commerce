"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { applyStorefrontTheme } from "./actions";
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

      <section>
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[850px] grid-cols-[minmax(0,1fr)_260px] items-start gap-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Web</p>
              <div className="max-h-[760px] overflow-y-auto rounded-sm border border-border bg-background shadow-sm">
                <div className="flex h-8 items-center gap-1.5 border-b border-border bg-muted/60 px-3">
                  <span className="size-2 rounded-full bg-red-400" />
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span className="size-2 rounded-full bg-green-400" />
                </div>
                {themeId === "legacy-classic" ? (
                  <Image
                    src="/images/themes/legacy-classic/desktop.png"
                    alt="Legacy Classic desktop landing page preview"
                    width={1440}
                    height={5000}
                    className="h-auto w-full"
                  />
                ) : (
                  <ThemePreviewMockup
                    themeId={themeId}
                    primary={primary}
                    viewport="web"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Phone</p>
              <div className="max-h-[844px] overflow-y-auto rounded-xl border-4 border-neutral-900 bg-neutral-900 shadow-sm">
                <div className="mx-auto h-4 w-24 rounded-b-xl bg-neutral-900" />
                {themeId === "legacy-classic" ? (
                  <Image
                    src="/images/themes/legacy-classic/mobile.png"
                    alt="Legacy Classic phone landing page preview"
                    width={390}
                    height={2600}
                    className="h-auto w-full"
                  />
                ) : (
                  <ThemePreviewMockup
                    themeId={themeId}
                    primary={primary}
                    viewport="phone"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
