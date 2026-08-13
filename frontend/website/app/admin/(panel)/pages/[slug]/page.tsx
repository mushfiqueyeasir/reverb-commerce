import { notFound, redirect } from "next/navigation";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { BackLink, PageHeader } from "@/components/admin/PageHeader";
import type { CmsPageSlug } from "@/lib/cms/jsonStore";
import { getPage } from "../actions";
import { PageForm } from "./PageForm";

export const dynamic = "force-dynamic";

const LABELS: Record<Exclude<CmsPageSlug, "about">, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  refund: "Returns",
};

const SLUGS: CmsPageSlug[] = ["about", "terms", "privacy", "refund"];

export default async function EditPageAdmin({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  if (!SLUGS.includes(raw as CmsPageSlug)) notFound();
  const slug = raw as CmsPageSlug;

  if (slug === "about") {
    redirect("/admin/about");
  }

  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const page = await getPage(slug);

  return (
    <div>
      <BackLink href="/admin/pages" label="Back to pages" />
      <PageHeader
        title={`Edit ${LABELS[slug]}`}
        description="Content is published to the storefront immediately after save."
      />
      <PageForm page={page} canWrite={writable} />
    </div>
  );
}
