import { redirect } from "next/navigation";
import { listSections } from "../../homepage/actions";

export const dynamic = "force-dynamic";

export default async function NewBannerPage() {
  const sections = await listSections();
  const banner = sections.find((section) => section.type === "banner");
  redirect(
    banner
      ? `/admin/homepage/banners/new?section=${banner.id}`
      : "/admin/homepage",
  );
}
