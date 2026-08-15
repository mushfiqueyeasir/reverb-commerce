import { notFound } from "next/navigation";
import { BackLink, PageHeader } from "@/components/admin/PageHeader";
import { requireRole } from "@/lib/admin/auth";
import {
  AVAILABLE_STOREFRONT_THEMES,
  createDefaultStorefrontThemeConfig,
  resolveStorefrontThemeTokens,
} from "@/lib/theme/manifest";
import { readStorefrontThemeWorkspace } from "@/lib/theme/store";
import { ThemeWorkspace } from "../ThemeWorkspace";

export const dynamic = "force-dynamic";

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  await requireRole(["admin"]);
  const { themeId } = await params;
  const theme = AVAILABLE_STOREFRONT_THEMES.find(
    (availableTheme) => availableTheme.id === themeId,
  );
  if (!theme) notFound();

  const workspace = await readStorefrontThemeWorkspace();
  const matchingConfig =
    workspace.draft?.config.themeId === theme.id
      ? workspace.draft.config
      : workspace.published.config.themeId === theme.id
        ? workspace.published.config
        : createDefaultStorefrontThemeConfig(theme);
  const primary = resolveStorefrontThemeTokens(matchingConfig).palette.primary;

  return (
    <div>
      <BackLink href="/admin/themes" label="Back to themes" />
      <PageHeader
        title={theme.displayName}
        description="Preview the theme on web and phone, choose its primary color, then apply it."
      />
      <ThemeWorkspace
        key={`${theme.id}-${workspace.draft?.version ?? 0}`}
        themeId={theme.id}
        themeName={theme.displayName}
        initialPrimary={primary}
        expectedVersion={workspace.draft?.version ?? 0}
        isPublished={workspace.published.config.themeId === theme.id}
      />
    </div>
  );
}
