import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  getAboutSectionDisplayName,
  getAboutSectionVersion,
} from "@/lib/cms/aboutSections";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import { AboutSectionForm } from "../AboutSectionForm";
import { listAboutSections } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditAboutSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const sections = await listAboutSections();
  const section = sections.find((s) => s.id === id);
  if (!section) notFound();
  const displayName = getAboutSectionDisplayName(section.type) ?? section.type;
  const version = getAboutSectionVersion(section.type);

  return (
    <div>
      <BackLink href="/admin/about" label="Back to About page" />
      <PageHeader
        title={`Edit ${displayName}${version && version > 1 ? ` (v${version})` : ""}`}
        description="Control the content this About block shows."
      />
      <AboutSectionForm section={section} />
    </div>
  );
}
