import { AdminCard } from "@/components/admin/AdminCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireRole } from "@/lib/admin/auth";
import {
  readStorefrontThemeHistory,
  readStorefrontThemeWorkspace,
} from "@/lib/theme/store";
import { ThemeStorefrontPreview } from "./ThemeStorefrontPreview";
import { ThemeWorkspace } from "./ThemeWorkspace";

export const dynamic = "force-dynamic";

export default async function ThemesAdminPage() {
  await requireRole(["admin"]);

  try {
    const [workspace, history] = await Promise.all([
      readStorefrontThemeWorkspace(),
      readStorefrontThemeHistory(),
    ]);
    return (
      <div>
        <PageHeader
          title="Themes"
          description="Manage code-owned storefront themes, semantic tokens, publishing, and rollback."
        />
        <ThemeWorkspace
          key={`${workspace.latestRevision}-${workspace.draft?.version ?? 0}`}
          workspace={workspace}
          history={history}
          preview={
            <ThemeStorefrontPreview
              config={workspace.draft?.config ?? workspace.published.config}
            />
          }
        />
      </div>
    );
  } catch (error) {
    return (
      <div>
        <PageHeader
          title="Themes"
          description="Manage code-owned storefront themes, semantic tokens, publishing, and rollback."
        />
        <AdminCard title="Theme storage unavailable">
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Unable to load storefront themes. Apply the storefront theme migration and retry."}
          </p>
        </AdminCard>
      </div>
    );
  }
}
