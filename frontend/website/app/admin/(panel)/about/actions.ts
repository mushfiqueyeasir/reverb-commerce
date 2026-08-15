"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import {
  ensureAboutSections,
  type AboutSectionRow,
  type AboutSectionType,
  ABOUT_SECTION_TYPES,
} from "@/lib/cms/aboutSections";
import { readCmsBlob, writeCmsBlob } from "@/lib/cms/jsonStore";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";

function revalidate() {
  revalidatePath("/admin/about");
  revalidatePath("/admin/pages");
  revalidatePath("/about-us");
}

async function persist(sections: AboutSectionRow[]) {
  const cms = await readCmsBlob();
  cms.about_sections = sections;
  return writeCmsBlob(cms);
}

export async function listAboutSections(): Promise<AboutSectionRow[]> {
  const cms = await readCmsBlob();
  const ensured = ensureAboutSections(cms.about_sections ?? []);
  const needsWrite =
    !Array.isArray(cms.about_sections) ||
    cms.about_sections.length !== ensured.length ||
    ensured.some((row) => !cms.about_sections.some((e) => e.type === row.type));
  if (needsWrite) {
    await persist(ensured);
  }
  return ensured;
}

export async function saveAboutSection(input: {
  id: string;
  type: AboutSectionType;
  title: string | null;
  active: boolean;
  config: Record<string, unknown>;
}): Promise<{ error?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!ABOUT_SECTION_TYPES.includes(input.type)) {
    return { error: "Invalid section type." };
  }

  const rows = await listAboutSections();
  const current = rows.find((r) => r.id === input.id);
  if (!current) return { error: "Section not found." };
  if (current.type !== input.type) {
    return { error: "Section type cannot be changed." };
  }

  const now = new Date().toISOString();
  const next = rows.map((r) =>
    r.id === input.id
      ? {
          ...r,
          title: input.title,
          active: input.active,
          config: input.config,
          updated_at: now,
        }
      : r,
  );

  const res = await persist(next);
  if (res.error) return { error: res.error };
  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "about_section",
    entityId: input.id,
    summary: `Updated about section "${input.title?.trim() || current.type}"`,
  });
  revalidate();
  return {};
}

export async function toggleAboutSection(
  id: string,
  active: boolean,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }

  const rows = await listAboutSections();
  const section = rows.find((r) => r.id === id);
  if (!section) return { error: "Section not found." };
  const sectionLabel = section.title?.trim() || section.type;

  const next = rows.map((r) =>
    r.id === id ? { ...r, active, updated_at: new Date().toISOString() } : r,
  );
  const res = await persist(next);
  if (res.error) return { error: res.error };

  await writeAuditLog({
    actor: s,
    action: "toggle",
    entity: "about_section",
    entityId: id,
    summary: `${active ? "Enabled" : "Disabled"} about section "${sectionLabel}"`,
    metadata: { active },
  });

  revalidate();
}

export async function reorderAboutSections(
  orderedIds: string[],
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }

  const [rows, publishedTheme] = await Promise.all([
    listAboutSections(),
    readCurrentPublishedStorefrontTheme(),
  ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const themeRows = rows.filter((row) =>
    manifest.slots.about.sectionTypes.includes(row.type),
  );
  if (
    orderedIds.length !== themeRows.length ||
    new Set(orderedIds).size !== themeRows.length ||
    !orderedIds.every((id) => themeRows.some((row) => row.id === id))
  ) {
    return { error: "Invalid section order." };
  }

  const now = new Date().toISOString();
  const byId = new Map(themeRows.map((row) => [row.id, row]));
  const next = orderedIds.map((id, index) => ({
    ...byId.get(id)!,
    sort: index,
    updated_at: now,
  }));
  const reordered = new Map(next.map((row) => [row.id, row]));
  const merged = rows.map((row) => reordered.get(row.id) ?? row);

  const res = await persist(merged);
  if (res.error) return { error: res.error };

  await writeAuditLog({
    actor: s,
    action: "reorder",
    entity: "about_section",
    summary: "Reordered about sections",
  });

  revalidate();
}
