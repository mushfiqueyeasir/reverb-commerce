"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, isAdmin } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import { readCmsBlobForWrite, writeCmsSection } from "@/lib/cms/jsonStore";
import {
  FOOTER_VARIANTS,
  normalizeFooterConfig,
  type FooterConfig,
  type FooterVariant,
} from "@/lib/cms/siteChrome";

function revalidate() {
  revalidatePath("/admin/footer");
  revalidatePath("/", "layout");
}

export async function saveFooter(
  input: FooterConfig,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!isAdmin(session.role)) {
    return { error: "Only administrators can update the footer." };
  }
  const footer = normalizeFooterConfig(input);
  const result = await writeCmsSection("footer", footer);
  if (result.error) return result;
  await writeAuditLog({
    actor: session,
    action: "update",
    entity: "footer",
    entityId: "site-footer",
    summary: "Updated footer content",
    metadata: {
      variant: footer.variant,
      columnCount: footer.columns.length,
      legalLinkCount: footer.legalLinks.length,
    },
  });
  revalidate();
  return {};
}

export async function enableFooterDesign(
  variant: FooterVariant,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!isAdmin(session.role)) {
    return { error: "Only administrators can update the footer." };
  }
  if (!FOOTER_VARIANTS.includes(variant)) {
    return { error: "Invalid footer design." };
  }
  try {
    const cms = await readCmsBlobForWrite();
    const footer = normalizeFooterConfig({ ...cms.footer, variant });
    const result = await writeCmsSection("footer", footer);
    if (result.error) return result;
    await writeAuditLog({
      actor: session,
      action: "toggle",
      entity: "footer",
      entityId: variant,
      summary: `Enabled the ${variant} footer design`,
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
