import { PageHeader } from "@/components/admin/PageHeader";
import { requireRole } from "@/lib/admin/auth";
import { readCmsBlob } from "@/lib/cms/jsonStore";
import { FooterForm } from "./FooterForm";

export const dynamic = "force-dynamic";

export default async function FooterAdminPage() {
  await requireRole(["admin"]);
  const cms = await readCmsBlob();
  return (
    <div>
      <PageHeader
        title="Footer"
        description="Manage footer content and links shared by the active storefront theme."
      />
      <FooterForm initialConfig={cms.footer} />
    </div>
  );
}
