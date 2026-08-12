import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import { isBannerSectionType } from "@/type/db";
import { BannerForm } from "../../../banners/BannerForm";
import { listBanners } from "../../../banners/actions";
import { listSections } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditHomepageBannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const { section: sectionParam } = await searchParams;
  const sections = await listSections();
  const bannerSection = sectionParam
    ? sections.find((section) => section.id === sectionParam)
    : sections.find((section) => section.type === "banner");
  if (!bannerSection || !isBannerSectionType(bannerSection.type)) notFound();
  const banners = await listBanners(bannerSection.type);
  const banner = banners.find((b) => b.id === id);
  if (!banner) notFound();

  const returnTo = `/admin/homepage/${bannerSection.id}?tab=slides`;

  return (
    <div>
      <BackLink href={returnTo} label="Back to banner" />
      <PageHeader
        title="Edit banner slide"
        description={banner.title || "Untitled slide"}
      />
      <BannerForm
        banner={banner}
        sectionType={bannerSection.type}
        returnTo={returnTo}
      />
    </div>
  );
}
