import { notFound } from "next/navigation";
import { requireRole } from "@/lib/admin/auth";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import { isBannerSectionType } from "@/type/db";
import { BannerForm } from "../../../banners/BannerForm";
import { listSections } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewHomepageBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  await requireRole(["admin", "editor"]);
  const { section: sectionParam } = await searchParams;
  const sections = await listSections();
  const bannerSection = sectionParam
    ? sections.find((section) => section.id === sectionParam)
    : sections.find((section) => section.type === "banner");
  if (!bannerSection || !isBannerSectionType(bannerSection.type)) notFound();
  const returnTo = `/admin/homepage/${bannerSection.id}?tab=slides`;

  return (
    <div>
      <BackLink href={returnTo} label="Back to banner" />
      <PageHeader
        title="New banner slide"
        description="Add an image slide for the homepage Banner section."
      />
      <BannerForm sectionType={bannerSection.type} returnTo={returnTo} />
    </div>
  );
}
