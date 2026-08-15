import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { AboutTable } from "./AboutTable";
import { listAboutSections } from "./actions";

export const dynamic = "force-dynamic";

export default async function AboutAdminPage() {
  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const [sections, publishedTheme] = await Promise.all([
    listAboutSections(),
    readCurrentPublishedStorefrontTheme(),
  ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const themeSections = sections.filter((section) =>
    manifest.slots.about.sectionTypes.includes(section.type),
  );

  return (
    <div>
      <PageHeader
        title="About page"
        description={`Manage the About sections included in ${manifest.displayName}.`}
      />
      <AboutTable
        data={themeSections}
        canWrite={writable}
        themeId={manifest.id}
        rendererMapping={manifest.renderers.aboutSections}
      />
    </div>
  );
}
