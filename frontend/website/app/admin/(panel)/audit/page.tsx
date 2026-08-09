import { requireRole } from "@/lib/admin/auth";
import {
  HIDDEN_ADMIN_EMAIL,
  isHiddenAdminEmail,
} from "@/lib/admin/userVisibility";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import type { AuditLogRow } from "@/type/db";
import { redirect } from "next/navigation";
import { AuditLogTable } from "./AuditLogTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type AuditSearchParams = {
  page?: string | string[];
  entity?: string | string[];
  action?: string | string[];
  actor?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function pageUrl(
  page: number,
  filters: { entity: string; action: string; actor: string },
) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filters.entity) params.set("entity", filters.entity);
  if (filters.action) params.set("action", filters.action);
  if (filters.actor) params.set("actor", filters.actor);
  const query = params.toString();
  return `/admin/audit${query ? `?${query}` : ""}`;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<AuditSearchParams>;
}) {
  await requireRole(["admin"]);

  const params = await searchParams;
  const requestedPage = Number.parseInt(firstParam(params.page), 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const filters = {
    entity: firstParam(params.entity),
    action: firstParam(params.action),
    actor: firstParam(params.actor),
  };

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("audit_logs")
    .select(
      "id, created_at, actor_id, actor_email, actor_role, action, entity, entity_id, summary, metadata",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .or(`actor_email.is.null,actor_email.neq.${HIDDEN_ADMIN_EMAIL}`);

  if (filters.entity) query = query.eq("entity", filters.entity);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.actor) {
    query = query.ilike("actor_email", filters.actor);
  }

  const offset = (page - 1) * PAGE_SIZE;
  const admin = createSupabaseAdminClient();
  const [{ data, error, count }, { data: authData }] = await Promise.all([
    query.range(offset, offset + PAGE_SIZE - 1),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const userEmails = [
    ...new Set(
      (authData?.users ?? [])
        .map((user) => user.email?.trim())
        .filter(
          (email): email is string =>
            Boolean(email) && !isHiddenAdminEmail(email),
        ),
    ),
  ].sort((a, b) => a.localeCompare(b));

  if (!error && page > totalPages) {
    redirect(pageUrl(totalPages, filters));
  }

  const rows: AuditLogRow[] = ((data as AuditLogRow[] | null) ?? []).map(
    (row) => ({
      ...row,
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {},
    }),
  );

  return (
    <div>
      <PageHeader
        title="Audit log"
        description={
          error
            ? "Could not load audit events. Apply migration 0013_audit_logs.sql if the table is missing."
            : "Security trail of admin changes and key storefront events."
        }
      />
      <AuditLogTable
        data={rows}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        entityFilter={filters.entity}
        actionFilter={filters.action}
        actorFilter={filters.actor}
        userEmails={userEmails}
      />
    </div>
  );
}
