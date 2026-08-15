"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import type { HomepageSectionRow, HomepageSectionType } from "@/type/db";
import {
  getHomepageSectionMetadata,
  normalizeHomepageSections,
  normalizeHomepageSectionType,
} from "@/lib/cms/homepageSections";
import { parseHomepageStoryConfig } from "@/lib/cms/homepageStory";
import { sanitizeCmsHtml } from "@/lib/html/sanitize";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { readCmsBlob, tableExists, writeCmsBlob } from "@/lib/cms/jsonStore";

export interface SectionInput {
  id: string;
  type: HomepageSectionType;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  active: boolean;
  config?: Record<string, unknown>;
}

function revalidate() {
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

async function persistSections(
  rows: HomepageSectionRow[],
): Promise<{ error?: string }> {
  if (await tableExists("homepage_sections")) {
    const supabase = await createSupabaseServerClient();
    for (const row of rows) {
      const { error } = await supabase.from("homepage_sections").upsert({
        id: row.id,
        type: row.type,
        title: row.title,
        subtitle: row.subtitle,
        body: row.body,
        sort: row.sort,
        active: row.active,
        config: row.config ?? {},
        updated_at: row.updated_at,
      });
      if (error) return { error: error.message };
    }
    return {};
  }

  const cms = await readCmsBlob();
  cms.homepage_sections = rows;
  return writeCmsBlob(cms);
}

export async function listSections(): Promise<HomepageSectionRow[]> {
  let existing: HomepageSectionRow[] = [];

  if (await tableExists("homepage_sections")) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("homepage_sections")
      .select("*")
      .order("sort", { ascending: true });
    existing = (data ?? []) as HomepageSectionRow[];
  } else {
    const cms = await readCmsBlob();
    existing = cms.homepage_sections;
  }

  const ensured = normalizeHomepageSections(existing);
  const missing = ensured.filter(
    (row) =>
      !existing.some(
        (e) => normalizeHomepageSectionType(String(e.type)) === row.type,
      ),
  );
  const needsMigrate = existing.some((e) => String(e.type) === "hero");

  if (missing.length > 0 || needsMigrate) {
    const result = await persistSections(ensured);
    if (result.error) throw new Error(result.error);
  }

  return ensured;
}

export async function saveSection(
  input: SectionInput,
): Promise<{ error?: string; id?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!input.id) {
    return { error: "Homepage sections are predefined and cannot be created." };
  }
  const inputType = normalizeHomepageSectionType(input.type);
  if (!inputType) {
    return { error: "Invalid section type." };
  }

  const rows = await listSections();
  const current = rows.find((r) => r.id === input.id);
  if (!current) {
    return { error: "Section not found." };
  }
  if (current.type !== inputType) {
    return { error: "Section type cannot be changed." };
  }

  const now = new Date().toISOString();
  const config = {
    ...(current.config ?? {}),
    ...(input.config ?? {}),
  };
  const metadata = getHomepageSectionMetadata(current.type);
  if (metadata?.family === "featured") {
    const maximum = metadata.version === 2 ? 6 : 5;
    const requestedLimit = Number(config.limit);
    const normalizedLimit = Number.isFinite(requestedLimit)
      ? Math.min(maximum, Math.max(1, Math.floor(requestedLimit)))
      : maximum;
    config.limit = normalizedLimit === maximum - 1 ? maximum : normalizedLimit;
    config.cta_label =
      typeof config.cta_label === "string" && config.cta_label.trim()
        ? config.cta_label.trim()
        : "View all products";
    config.cta_url = "/product";
  }
  if (current.type === "categories") {
    if (!Array.isArray(config.category_ids)) {
      return { error: "Mosaic categories must be an ordered list." };
    }
    const categoryIds = config.category_ids.filter(
      (categoryId): categoryId is string => typeof categoryId === "string",
    );
    if (
      categoryIds.length !== config.category_ids.length ||
      categoryIds.length > 4 ||
      new Set(categoryIds).size !== categoryIds.length
    ) {
      return { error: "Choose up to four unique Mosaic categories." };
    }
    if (categoryIds.length) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("categories")
        .select("id, parent_id, is_default")
        .in("id", categoryIds);
      if (error) return { error: error.message };
      if (
        (data ?? []).length !== categoryIds.length ||
        (data ?? []).some(
          (category) => category.parent_id && !category.is_default,
        )
      ) {
        return { error: "Mosaic only supports root categories." };
      }
    }
    config.category_ids = categoryIds;
  }
  if (current.type === "richtext" || current.type === "richtext_v2") {
    if (config.cards != null && !Array.isArray(config.cards)) {
      return { error: "Story cards must be an ordered list." };
    }
    if (Array.isArray(config.cards) && config.cards.length > 6) {
      return { error: "A Story section can have a maximum of six cards." };
    }
    const story = parseHomepageStoryConfig(config);
    if (
      story.imagePath?.includes("..") ||
      (story.imagePath?.length ?? 0) > 500
    ) {
      return { error: "Story image path is invalid." };
    }
    config.layout = current.type === "richtext_v2" ? "feature" : story.layout;
    config.image_path = story.imagePath;
    config.image_bucket = "branding";
    config.image_alt = story.imageAlt;
    config.image_label = story.imageLabel;
    config.image_value = story.imageValue;
    config.image_tag = story.imageTag;
    config.copy_label = story.copyLabel;
    config.cards_label = story.cardsLabel;
    config.cards = story.cards;
  }
  const payload = {
    type: current.type,
    title: input.title,
    subtitle: input.subtitle,
    body: input.body ? sanitizeCmsHtml(input.body) : null,
    sort: current.sort,
    active: input.active,
    config,
    updated_at: now,
  };

  if (await tableExists("homepage_sections")) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("homepage_sections")
      .update(payload)
      .eq("id", input.id);
    if (error) return { error: error.message };
    await writeAuditLog({
      actor: s,
      action: "update",
      entity: "homepage_section",
      entityId: input.id,
      summary: `Updated homepage section "${input.title?.trim() || current.type}"`,
    });
    revalidate();
    return { id: input.id };
  }

  const cms = await readCmsBlob();
  cms.homepage_sections = cms.homepage_sections.map((x) =>
    x.id === input.id
      ? {
          ...x,
          ...payload,
          type: current.type,
        }
      : x,
  );
  // Ensure row exists in blob after normalizeHomepageSections
  if (!cms.homepage_sections.some((x) => x.id === input.id)) {
    cms.homepage_sections = normalizeHomepageSections(
      cms.homepage_sections,
    ).map((x) =>
      x.id === input.id ? { ...x, ...payload, type: current.type } : x,
    );
  }
  const res = await writeCmsBlob(cms);
  if (res.error) return { error: res.error };
  await writeAuditLog({
    actor: s,
    action: "update",
    entity: "homepage_section",
    entityId: input.id,
    summary: `Updated homepage section "${input.title?.trim() || current.type}"`,
  });
  revalidate();
  return { id: input.id };
}

export async function deleteSection(): Promise<{ error?: string }> {
  return {
    error:
      "Homepage sections are predefined and cannot be deleted. Hide them instead.",
  };
}

export async function toggleSection(
  id: string,
  active: boolean,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }

  const rows = await listSections();
  const section = rows.find((r) => r.id === id);
  const sectionLabel = section?.title?.trim() || section?.type || id;

  if (await tableExists("homepage_sections")) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("homepage_sections")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const cms = await readCmsBlob();
    let rows = normalizeHomepageSections(cms.homepage_sections);
    rows = rows.map((x) =>
      x.id === id ? { ...x, active, updated_at: new Date().toISOString() } : x,
    );
    cms.homepage_sections = rows;
    const res = await writeCmsBlob(cms);
    if (res.error) return { error: res.error };
  }

  await writeAuditLog({
    actor: s,
    action: "toggle",
    entity: "homepage_section",
    entityId: id,
    summary: `${active ? "Enabled" : "Disabled"} homepage section "${sectionLabel}"`,
    metadata: { active },
  });

  revalidate();
}

export async function reorderSections(
  orderedIds: string[],
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }

  const [rows, publishedTheme] = await Promise.all([
    listSections(),
    readCurrentPublishedStorefrontTheme(),
  ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const themeRows = rows.filter((row) =>
    manifest.slots.homepage.sectionTypes.includes(row.type),
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

  if (await tableExists("homepage_sections")) {
    const supabase = await createSupabaseServerClient();
    for (const row of next) {
      const { error } = await supabase
        .from("homepage_sections")
        .update({ sort: row.sort, updated_at: now })
        .eq("id", row.id);
      if (error) return { error: error.message };
    }
  } else {
    const cms = await readCmsBlob();
    const reordered = new Map(next.map((row) => [row.id, row]));
    cms.homepage_sections = rows.map((row) => reordered.get(row.id) ?? row);
    const res = await writeCmsBlob(cms);
    if (res.error) return { error: res.error };
  }

  await writeAuditLog({
    actor: s,
    action: "reorder",
    entity: "homepage_section",
    summary: "Reordered homepage sections",
  });

  revalidate();
}
