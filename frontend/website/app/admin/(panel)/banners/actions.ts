"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import {
  newId,
  readCmsBlob,
  tableExists,
  writeCmsBlob,
} from "@/lib/cms/jsonStore";
import {
  isBannerSectionType,
  type BannerRow,
  type BannerSectionType,
} from "@/type/db";

export interface BannerInput {
  id?: string;
  section_type: BannerSectionType;
  title: string | null;
  subtitle: string | null;
  image_path: string | null;
  mobile_image_path: string | null;
  cta_label: string | null;
  cta_url: string | null;
  /** Omit to keep existing order (edit) or append at end (create). */
  sort?: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

function revalidate() {
  revalidatePath("/admin/banners");
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

export async function listBanners(
  sectionType: BannerSectionType,
): Promise<BannerRow[]> {
  if (!isBannerSectionType(sectionType)) return [];
  if (await tableExists("banners")) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("section_type", sectionType)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error) return (data ?? []) as BannerRow[];

    const missingSectionType =
      error.code === "42703" || error.message.includes("section_type");
    if (!missingSectionType || sectionType === "banner_v2") return [];

    const legacy = await supabase
      .from("banners")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false });
    if (legacy.error) return [];
    return ((legacy.data ?? []) as Omit<BannerRow, "section_type">[]).map(
      (row) => ({ ...row, section_type: "banner" }),
    );
  }
  const cms = await readCmsBlob();
  return cms.banners
    .filter((banner) => banner.section_type === sectionType)
    .sort((a, b) => a.sort - b.sort);
}

export async function saveBanner(
  input: BannerInput,
): Promise<{ error?: string; id?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!isBannerSectionType(input.section_type)) {
    return { error: "Invalid banner section." };
  }
  if (!input.image_path) return { error: "A banner image is required." };
  if (!input.title?.trim()) {
    return { error: "A headline is required for every banner slide." };
  }

  const now = new Date().toISOString();
  const existing = await listBanners(input.section_type);
  const previous = input.id
    ? existing.find((b) => b.id === input.id)
    : undefined;
  if (input.id && !previous) {
    return { error: "Banner slide not found in this section." };
  }
  const maxSort = existing.reduce((m, b) => Math.max(m, b.sort), 0);
  const sort =
    typeof input.sort === "number" && Number.isFinite(input.sort)
      ? input.sort
      : previous
        ? previous.sort
        : maxSort + 10;

  const payload = {
    section_type: input.section_type,
    title: input.title!.trim(),
    subtitle: input.subtitle,
    image_path: input.image_path,
    mobile_image_path: input.mobile_image_path,
    cta_label: input.cta_label,
    cta_url: input.cta_url,
    sort,
    active: input.active,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    updated_at: now,
  };

  if (await tableExists("banners")) {
    const supabase = await createSupabaseServerClient();
    const query = input.id
      ? supabase
          .from("banners")
          .update(payload)
          .eq("id", input.id)
          .eq("section_type", input.section_type)
      : supabase.from("banners").insert(payload);
    const { data, error } = await query.select("id").single();
    if (error) return { error: error.message };
    const bannerId = data.id as string;
    await writeAuditLog({
      actor: s,
      action: input.id ? "update" : "create",
      entity: "banner",
      entityId: bannerId,
      summary: input.id
        ? `Updated banner "${input.title!.trim()}"`
        : `Created banner "${input.title!.trim()}"`,
    });
    revalidate();
    return { id: bannerId };
  }

  const cms = await readCmsBlob();
  const id = input.id || newId();
  const row: BannerRow = {
    id,
    ...payload,
    image_path: input.image_path!,
    created_at: cms.banners.find((b) => b.id === id)?.created_at ?? now,
  };
  const idx = cms.banners.findIndex((b) => b.id === id);
  if (idx >= 0) cms.banners[idx] = row;
  else cms.banners.push(row);
  const res = await writeCmsBlob(cms);
  if (res.error) return { error: res.error };
  await writeAuditLog({
    actor: s,
    action: input.id ? "update" : "create",
    entity: "banner",
    entityId: id,
    summary: input.id
      ? `Updated banner "${input.title!.trim()}"`
      : `Created banner "${input.title!.trim()}"`,
  });
  revalidate();
  return { id };
}

export async function deleteBanner(
  id: string,
  sectionType: BannerSectionType,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!isBannerSectionType(sectionType)) {
    return { error: "Invalid banner section." };
  }

  const existing = await listBanners(sectionType);
  const banner = existing.find((b) => b.id === id);
  if (!banner) return { error: "Banner slide not found in this section." };
  const bannerLabel = banner.title?.trim() || id;

  if (await tableExists("banners")) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("banners")
      .delete()
      .eq("id", id)
      .eq("section_type", sectionType);
    if (error) return { error: error.message };
  } else {
    const cms = await readCmsBlob();
    cms.banners = cms.banners.filter(
      (b) => b.id !== id || b.section_type !== sectionType,
    );
    const res = await writeCmsBlob(cms);
    if (res.error) return { error: res.error };
  }

  await writeAuditLog({
    actor: s,
    action: "delete",
    entity: "banner",
    entityId: id,
    summary: banner?.title?.trim()
      ? `Deleted banner "${bannerLabel}"`
      : `Deleted banner ${id}`,
  });

  revalidate();
}

export async function toggleBanner(
  id: string,
  active: boolean,
  sectionType: BannerSectionType,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!isBannerSectionType(sectionType)) {
    return { error: "Invalid banner section." };
  }

  const existing = await listBanners(sectionType);
  const banner = existing.find((b) => b.id === id);
  if (!banner) return { error: "Banner slide not found in this section." };
  const bannerLabel = banner.title?.trim() || id;

  if (await tableExists("banners")) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("banners")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("section_type", sectionType);
    if (error) return { error: error.message };
  } else {
    const cms = await readCmsBlob();
    cms.banners = cms.banners.map((b) =>
      b.id === id && b.section_type === sectionType
        ? { ...b, active, updated_at: new Date().toISOString() }
        : b,
    );
    const res = await writeCmsBlob(cms);
    if (res.error) return { error: res.error };
  }

  await writeAuditLog({
    actor: s,
    action: "toggle",
    entity: "banner",
    entityId: id,
    summary: `${active ? "Enabled" : "Disabled"} banner "${bannerLabel}"`,
    metadata: { active },
  });

  revalidate();
}

export async function reorderBanners(
  orderedIds: string[],
  sectionType: BannerSectionType,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!isBannerSectionType(sectionType)) {
    return { error: "Invalid banner section." };
  }

  const rows = await listBanners(sectionType);
  if (
    orderedIds.length !== rows.length ||
    new Set(orderedIds).size !== rows.length ||
    !orderedIds.every((id) => rows.some((r) => r.id === id))
  ) {
    return { error: "Invalid slide order." };
  }

  const now = new Date().toISOString();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const next = orderedIds.map((id, index) => ({
    ...byId.get(id)!,
    sort: (index + 1) * 10,
    updated_at: now,
  }));

  if (await tableExists("banners")) {
    const supabase = await createSupabaseServerClient();
    for (const row of next) {
      const { error } = await supabase
        .from("banners")
        .update({ sort: row.sort, updated_at: now })
        .eq("id", row.id)
        .eq("section_type", sectionType);
      if (error) return { error: error.message };
    }
  } else {
    const cms = await readCmsBlob();
    const reordered = new Map(next.map((row) => [row.id, row]));
    cms.banners = cms.banners.map((row) => reordered.get(row.id) ?? row);
    const res = await writeCmsBlob(cms);
    if (res.error) return { error: res.error };
  }

  await writeAuditLog({
    actor: s,
    action: "reorder",
    entity: "banner",
    summary: "Reordered banners",
  });

  revalidate();
}
