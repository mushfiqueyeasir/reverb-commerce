"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";

export interface CategoryInput {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  sort?: number;
  image_path?: string | null;
}

export async function saveCategory(
  input: CategoryInput,
): Promise<{ error?: string; id?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role))
    return { error: "You do not have permission to do this." };

  if (!input.name?.trim()) return { error: "Name is required." };
  if (!input.slug?.trim()) return { error: "Slug is required." };
  const imagePath = input.image_path?.trim() || null;
  if (imagePath && /^https?:\/\//i.test(imagePath) && !/^https:\/\//i.test(imagePath)) {
    return { error: "Remote image URLs must use HTTPS." };
  }

  const supabase = await createSupabaseServerClient();
  const parentId = input.parent_id?.trim() || null;
  const { data: existing } = input.id
    ? await supabase
        .from("categories")
        .select("sort, parent_id, is_default")
        .eq("id", input.id)
        .maybeSingle()
    : { data: null };

  if (existing?.is_default && parentId) {
    return { error: "The default category must remain at the root." };
  }
  if (parentId === input.id) {
    return { error: "A category cannot be its own parent." };
  }
  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("categories")
      .select("id, is_default")
      .eq("id", parentId)
      .maybeSingle();
    if (parentError) return { error: parentError.message };
    if (!parent) return { error: "Parent category was not found." };
    if (parent.is_default) {
      return { error: "The default category cannot contain subcategories." };
    }
  }

  let sort = Number.isFinite(input.sort) ? Number(input.sort) : undefined;
  const parentChanged =
    input.id && (existing?.parent_id ?? null) !== parentId;
  if (sort == null && input.id && !parentChanged) {
    sort = (existing?.sort as number | undefined) ?? 10;
  }
  if (sort == null) {
    let query = supabase
      .from("categories")
      .select("sort")
      .order("sort", { ascending: false })
      .limit(1);
    query = parentId
      ? query.eq("parent_id", parentId)
      : query.is("parent_id", null);
    const { data: maxRow } = await query.maybeSingle();
    sort = ((maxRow?.sort as number | undefined) ?? 0) + 10;
  }

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description?.trim() || null,
    parent_id: existing?.is_default ? null : parentId,
    sort,
    image_path: imagePath,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = input.id
    ? await supabase
        .from("categories")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single()
    : await supabase.from("categories").insert(payload).select("id").single();

  if (error) return { error: error.message };

  const categoryId = data.id as string;
  const isCreate = !input.id;
  await writeAuditLog({
    actor: s,
    action: isCreate ? "create" : "update",
    entity: "category",
    entityId: categoryId,
    summary: isCreate
      ? `Created category "${input.name.trim()}"`
      : `Updated category "${input.name.trim()}"`,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  revalidatePath("/product");
  return { id: categoryId };
}

export async function deleteCategory(
  id: string,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role))
    return { error: "You do not have permission to do this." };

  const supabase = await createSupabaseServerClient();
  const { data: categoryRow } = await supabase
    .from("categories")
    .select("name, is_default")
    .eq("id", id)
    .maybeSingle();

  if (categoryRow?.is_default) {
    return { error: "The default category cannot be deleted." };
  }
  const { count: childCount, error: childError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (childError) return { error: childError.message };
  if (childCount) {
    return { error: "Move or delete this category's subcategories first." };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };

  await writeAuditLog({
    actor: s,
    action: "delete",
    entity: "category",
    entityId: id,
    summary: categoryRow?.name
      ? `Deleted category "${categoryRow.name}"`
      : `Deleted category ${id}`,
  });

  revalidatePath("/admin/categories");
}

export async function reorderCategories(
  orderedIds: string[],
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!orderedIds.length) return { error: "Invalid category order." };

  const supabase = await createSupabaseServerClient();
  const { data: defaultCategory, error: defaultError } = await supabase
    .from("categories")
    .select("id")
    .eq("is_default", true)
    .single();

  if (defaultError) return { error: defaultError.message };
  if (orderedIds[0] !== defaultCategory.id) {
    return { error: "The default category must remain first." };
  }

  const now = new Date().toISOString();

  for (let i = 1; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("categories")
      .update({ sort: i * 10, updated_at: now })
      .eq("id", orderedIds[i]);
    if (error) return { error: error.message };
  }

  await writeAuditLog({
    actor: s,
    action: "reorder",
    entity: "category",
    summary: "Reordered categories",
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
}
