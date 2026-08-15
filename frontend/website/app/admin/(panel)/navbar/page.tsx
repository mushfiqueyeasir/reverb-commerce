import { PageHeader } from "@/components/admin/PageHeader";
import { requireRole } from "@/lib/admin/auth";
import { readCmsBlob } from "@/lib/cms/jsonStore";
import { NavbarForm } from "./NavbarForm";

export const dynamic = "force-dynamic";

export default async function NavbarAdminPage() {
  await requireRole(["admin"]);
  const cms = await readCmsBlob();
  return (
    <div>
      <PageHeader
        title="Navbar"
        description="Manage navigation content shared by the active storefront theme."
      />
      <NavbarForm initialConfig={cms.navbar} />
    </div>
  );
}
