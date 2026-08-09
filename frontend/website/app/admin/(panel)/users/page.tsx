import { requireRole } from "@/lib/admin/auth";
import { isHiddenAdminEmail } from "@/lib/admin/userVisibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/PageHeader";
import type { UserRole } from "@/type/db";
import { UsersTable, type UserTableRow } from "./UsersTable";
import { NewUserDialog } from "./NewUserDialog";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireRole(["admin"]);

  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("id, full_name, role"),
  ]);

  const profileMap = new Map<
    string,
    { full_name: string | null; role: UserRole }
  >();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, {
      full_name: (p.full_name as string | null) ?? null,
      role: (p.role as UserRole) ?? "viewer",
    });
  }

  const rows: UserTableRow[] = (authData?.users ?? [])
    .filter((u) => !isHiddenAdminEmail(u.email))
    .map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "—",
        full_name: profile?.full_name ?? null,
        role: profile?.role ?? "viewer",
        created_at: u.created_at,
      };
    });

  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div>
      <PageHeader
        title="Users & roles"
        description="Manage staff accounts and their access levels."
      >
        <NewUserDialog />
      </PageHeader>
      <UsersTable data={rows} currentUserId={session.userId} />
    </div>
  );
}
