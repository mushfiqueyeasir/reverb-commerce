"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, isAdmin } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import {
  readCmsBlobForWrite,
  writeCmsSection,
} from "@/lib/cms/jsonStore";
import {
  NAVBAR_VARIANTS,
  normalizeNavbarConfig,
  type NavbarConfig,
  type NavbarVariant,
} from "@/lib/cms/siteChrome";

function revalidate() {
  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function saveNavbar(
  input: NavbarConfig,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!isAdmin(session.role)) {
    return { error: "Only administrators can update the navbar." };
  }
  const navbar = normalizeNavbarConfig(input);
  const result = await writeCmsSection("navbar", navbar);
  if (result.error) return result;
  await writeAuditLog({
    actor: session,
    action: "update",
    entity: "navbar",
    entityId: "site-navbar",
    summary: "Updated navbar content",
    metadata: { variant: navbar.variant, itemCount: navbar.items.length },
  });
  revalidate();
  return {};
}

export async function enableNavbarDesign(
  variant: NavbarVariant,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!isAdmin(session.role)) {
    return { error: "Only administrators can update the navbar." };
  }
  if (!NAVBAR_VARIANTS.includes(variant)) {
    return { error: "Invalid navbar design." };
  }
  try {
    const cms = await readCmsBlobForWrite();
    const navbar = normalizeNavbarConfig({ ...cms.navbar, variant });
    const result = await writeCmsSection("navbar", navbar);
    if (result.error) return result;
    await writeAuditLog({
      actor: session,
      action: "toggle",
      entity: "navbar",
      entityId: variant,
      summary: `Enabled the ${variant} navbar design`,
      metadata: { variant },
    });
    revalidate();
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to enable design.",
    };
  }
}
