import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminSession } from "@/lib/admin/auth";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "reorder"
  | "toggle"
  | "status_change"
  | "login"
  | "logout"
  | "login_failed"
  | "publish"
  | "rollback";

export type AuditEntity =
  | "product"
  | "category"
  | "inventory"
  | "order"
  | "homepage_section"
  | "banner"
  | "about_section"
  | "page"
  | "promotion"
  | "review"
  | "contact"
  | "settings"
  | "navbar"
  | "footer"
  | "user"
  | "security"
  | "auth"
  | "promo_code"
  | "storefront_theme";

export interface WriteAuditLogInput {
  actor?: Pick<AdminSession, "userId" | "email" | "role"> | null;
  action: AuditAction | string;
  entity: AuditEntity | string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append-only audit write via service role.
 * Failures are swallowed so logging never breaks the main action.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    const summary = input.summary?.trim();
    if (!summary) return;

    const admin = createSupabaseAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: input.actor?.userId ?? null,
      actor_email: input.actor?.email?.trim() || null,
      actor_role: input.actor?.role ?? null,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId?.trim() || null,
      summary,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Swallow — audit must never break the main action.
  }
}
