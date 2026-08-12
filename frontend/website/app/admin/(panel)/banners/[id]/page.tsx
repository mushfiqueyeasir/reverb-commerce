import { redirect } from "next/navigation";
import { listSections } from "../../homepage/actions";

export const dynamic = "force-dynamic";

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sections = await listSections();
  const banner = sections.find((section) => section.type === "banner");
  redirect(
    banner
      ? `/admin/homepage/banners/${id}?section=${banner.id}`
      : "/admin/homepage",
  );
}
