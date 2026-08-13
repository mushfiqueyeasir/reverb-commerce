import { notFound, redirect } from "next/navigation";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { BackLink, PageHeader } from "@/components/admin/PageHeader";
import { getPage } from "../actions";
import { PageForm } from "./PageForm";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  refund: "Returns",
};

export default async function EditPageAdmin({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === "about") {
    redirect("/admin/about");
  }

  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div>
      <BackLink href="/admin/pages" label="Back to pages" />
      <PageHeader
        title={`Edit ${LABELS[slug] ?? page.title}`}
        description="Content is published to the storefront immediately after save."
      />
      <PageForm page={page} canWrite={writable} />
    </div>
  );
}
