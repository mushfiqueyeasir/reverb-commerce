import { notFound } from "next/navigation";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import { getHomepageSectionDisplayName } from "@/lib/cms/homepageSections";
import { isBannerSectionType } from "@/type/db";
import { SectionForm } from "../SectionForm";
import { listSections } from "../actions";
import { listBanners } from "../../banners/actions";

export const dynamic = "force-dynamic";

export default async function EditSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const { id } = await params;
  const { tab } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [sections, promotionsRes] = await Promise.all([
    listSections(),
    supabase
      .from("promotions")
      .select("id, title, active")
      .order("created_at", { ascending: false }),
  ]);

  const section = sections.find((s) => s.id === id);
  if (!section) notFound();
  const bannerSectionType = isBannerSectionType(section.type)
    ? section.type
    : null;
  const isBanner = bannerSectionType !== null;
  const displayName =
    getHomepageSectionDisplayName(section.type) ?? section.type;
  const banners = bannerSectionType ? await listBanners(bannerSectionType) : [];

  const promotions = (
    (promotionsRes.data as
      { id: string; title: string; active: boolean }[] | null) ?? []
  ).map((p) => ({ id: p.id, title: p.title, active: p.active }));

  const initialTab = isBanner && tab === "slides" ? "slides" : "content";

  return (
    <div>
      <BackLink href="/admin/homepage" label="Back to homepage" />
      <PageHeader
        title={`Edit ${displayName}`}
        description={
          isBanner
            ? "Manage banner content and carousel slides."
            : "Control the content this homepage block shows."
        }
      />
      <SectionForm
        section={section}
        promotions={promotions}
        banners={banners}
        canWrite={writable}
        initialTab={initialTab}
      />
    </div>
  );
}
