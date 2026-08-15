"use client";

import { useTransition, type ReactNode } from "react";
import { Check, History, Loader2, RotateCcw, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/AdminCard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormActions } from "@/components/admin/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AVAILABLE_STOREFRONT_THEMES,
  createDefaultStorefrontThemeConfig,
  getStorefrontThemeManifest,
  resolveStorefrontThemeTokens,
  type StorefrontThemeConfig,
} from "@/lib/theme/manifest";
import { PALETTE_FIELDS, type ThemePalette } from "@/lib/theme/palette";
import type {
  StorefrontThemeRevision,
  StorefrontThemeWorkspace as ThemeWorkspaceState,
} from "@/lib/theme/store";
import { cn } from "@/lib/utils";
import {
  publishStorefrontThemeDraft,
  rollbackStorefrontTheme,
  saveStorefrontThemeDraft,
} from "./actions";

export function ThemeWorkspace({
  workspace,
  history,
  preview,
}: {
  workspace: ThemeWorkspaceState;
  history: StorefrontThemeRevision[];
  preview: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialConfig = workspace.draft?.config ?? workspace.published.config;
  const config = initialConfig;
  const palette = resolveStorefrontThemeTokens(config).palette;

  const selectTheme = (themeId: string) => {
    const theme = getStorefrontThemeManifest(themeId);
    if (theme.id === config.themeId) return;
    startTransition(async () => {
      const result = await saveStorefrontThemeDraft({
        config: createDefaultStorefrontThemeConfig(theme),
        expectedVersion: workspace.draft?.version ?? 0,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${theme.displayName} draft saved`);
      router.refresh();
    });
  };

  const savePalette = (nextPalette: ThemePalette) => {
    const nextConfig: StorefrontThemeConfig = {
      ...config,
      tokenOverrides: { palette: nextPalette },
    };
    startTransition(async () => {
      const result = await saveStorefrontThemeDraft({
        config: nextConfig,
        expectedVersion: workspace.draft?.version ?? 0,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Theme draft saved");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {workspace.isEmpty ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          No seeded theme revisions were found. Apply or rerun the storefront
          theme migration before saving a draft.
        </div>
      ) : null}

      <AdminCard
        title="Theme registry"
        description="Choose a code-owned storefront theme. New themes will appear here when installed."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {AVAILABLE_STOREFRONT_THEMES.map((theme, index) => {
            const selected = theme.id === config.themeId;
            return (
              <button
                key={theme.id}
                type="button"
                disabled={pending || !workspace.draft}
                onClick={() => selectTheme(theme.id)}
                className={cn(
                  "rounded-2xl border bg-background/60 p-5 text-left transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70",
                  selected && "border-primary ring-1 ring-primary/20",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-semibold text-foreground">
                    {theme.displayName}
                  </span>
                  {index === 0 ? (
                    <Badge variant="secondary">Default</Badge>
                  ) : null}
                  {selected ? (
                    <Badge variant="success">
                      <Check className="mr-1 size-3" /> Selected
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {theme.category} · v{theme.version}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {theme.description}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {theme.slots.homepage.sectionTypes.length} homepage renderers
                  · Navbar and footer included
                </p>
              </button>
            );
          })}
        </div>
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.65fr)]">
        <PaletteEditor
          key={`${workspace.latestRevision}-${config.themeId}`}
          palette={palette}
          pending={pending || !workspace.draft}
          onSave={savePalette}
        />
        <AdminCard
          title="Storefront preview"
          description="Current store content rendered with the private draft theme."
        >
          {preview}
        </AdminCard>
      </div>

      <AdminCard
        title="Publication"
        description="Draft changes are private until they are published."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <RevisionSummary
            label="Published revision"
            revision={workspace.published}
          />
          <RevisionSummary label="Draft revision" revision={workspace.draft} />
        </div>
        <FormActions className="mt-6">
          <ConfirmDialog
            trigger={
              <Button disabled={pending || !workspace.draft}>
                <Send /> Publish draft
              </Button>
            }
            title="Publish theme draft?"
            description="This immediately changes the storefront theme for every visitor."
            confirmLabel="Publish theme"
            destructive={false}
            action={() =>
              publishStorefrontThemeDraft({
                expectedVersion: workspace.draft?.version ?? 0,
              })
            }
            onDone={() => router.refresh()}
          />
        </FormActions>
      </AdminCard>

      <AdminCard
        title="Revision history"
        description="Restore a previously published theme configuration as a new revision."
        action={<History className="size-5 text-muted-foreground" />}
      >
        {history.length ? (
          <div className="divide-y divide-border">
            {history.map((revision) => {
              const current = revision.id === workspace.published.id;
              return (
                <div
                  key={`${revision.id ?? "revision"}-${revision.revisionNumber}`}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        Revision {revision.revisionNumber}
                      </span>
                      <Badge variant={current ? "success" : "secondary"}>
                        {current ? "Published" : revision.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {
                          getStorefrontThemeManifest(
                            revision.config.themeId,
                            revision.config.themeVersion,
                          ).displayName
                        }
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(revision.publishedAt ?? revision.createdAt)}
                    </p>
                  </div>
                  <ConfirmDialog
                    trigger={
                      <Button variant="outline" size="sm" disabled={current}>
                        <RotateCcw /> Roll back
                      </Button>
                    }
                    title={`Roll back to revision ${revision.revisionNumber}?`}
                    description="The restored configuration will be published as a new revision."
                    confirmLabel="Roll back"
                    action={() =>
                      rollbackStorefrontTheme({
                        targetRevisionId: revision.id ?? "",
                        targetRevision: revision.revisionNumber ?? 0,
                        expectedVersion: workspace.draft?.version ?? 0,
                      })
                    }
                    onDone={() => router.refresh()}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Published revisions will appear here.
          </p>
        )}
      </AdminCard>
    </div>
  );
}

function PaletteEditor({
  palette,
  pending,
  onSave,
}: {
  palette: ThemePalette;
  pending: boolean;
  onSave: (palette: ThemePalette) => void;
}) {
  const draft = { ...palette };
  return (
    <AdminCard
      title="Semantic palette"
      description="Customize Legacy Classic tokens without changing its renderers."
    >
      <form
        className="space-y-5"
        action={(formData) => {
          for (const field of PALETTE_FIELDS) {
            const value = formData.get(field.key);
            if (typeof value === "string") draft[field.key] = value;
          }
          onSave(draft);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {PALETTE_FIELDS.map((field) => (
            <label key={field.key} className="space-y-2">
              <span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {field.label}
              </span>
              <span className="flex items-center gap-3 rounded-xl border border-border bg-background p-2">
                <input
                  type="color"
                  name={field.key}
                  defaultValue={palette[field.key]}
                  className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {palette[field.key]}
                </span>
              </span>
            </label>
          ))}
        </div>
        <FormActions>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Save draft
          </Button>
        </FormActions>
      </form>
    </AdminCard>
  );
}

function RevisionSummary({
  label,
  revision,
}: {
  label: string;
  revision: StorefrontThemeRevision | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-xl font-semibold text-foreground">
        {revision?.status === "draft"
          ? `Draft version ${revision.version}`
          : revision && Number(revision.revisionNumber) > 0
            ? `Revision ${revision.revisionNumber}`
            : "Not saved"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {revision
          ? getStorefrontThemeManifest(
              revision.config.themeId,
              revision.config.themeVersion,
            ).displayName
          : "No draft is waiting to publish"}
      </p>
      {revision?.normalizationErrors.length ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Invalid persisted configuration was replaced with Legacy Classic.
        </p>
      ) : null}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
