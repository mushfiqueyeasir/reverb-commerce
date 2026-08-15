import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { HomepageWorkspace } from "./HomepageWorkspace";
import { listSections } from "./actions";

export const dynamic = "force-dynamic";

export default async function HomepagePage() {
  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const [sections, publishedTheme] = await Promise.all([
    listSections(),
    readCurrentPublishedStorefrontTheme(),
  ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const themeSections = sections.filter((section) =>
    manifest.slots.homepage.sectionTypes.includes(section.type),
  );

  return (
    <div>
      <PageHeader
        title="Homepage"
        description={`Manage the homepage sections included in ${manifest.displayName}.`}
      />
      <HomepageWorkspace sections={themeSections} canWrite={writable} />
    </div>
  );
}
