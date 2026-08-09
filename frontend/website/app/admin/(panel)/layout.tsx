import AdminShell from "@/components/admin/AdminShell";
import { requireAdminSession, canWrite, isAdmin } from "@/lib/admin/auth";
import { getSupabaseUrl } from "@/lib/config.server";
import { getSiteSettings } from "@/utility/getSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Server layout for the authenticated merchant panel. Loads the session/role
// (redirects to /admin/login if absent) and hands it to the client shell.
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, settings] = await Promise.all([
    requireAdminSession(),
    getSiteSettings(),
  ]);

  return (
    <AdminShell
      session={{
        userId: session.userId,
        role: session.role,
        email: session.email,
        fullName: session.fullName,
        storageBaseUrl: getSupabaseUrl(),
        canWrite: canWrite(session.role),
        isAdmin: isAdmin(session.role),
      }}
      storeName={settings.store_name || "Store"}
      logoUrl={settings.logoUrl}
      faviconUrl={settings.faviconUrl}
    >
      {children}
    </AdminShell>
  );
}
