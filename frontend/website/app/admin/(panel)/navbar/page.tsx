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
        description="Choose the storefront navbar design and manage its navigation content."
      />
      <NavbarForm initialConfig={cms.navbar} />
    </div>
  );
}
