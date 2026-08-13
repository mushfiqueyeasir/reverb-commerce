import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryImageUrl } from "@/utility/imageUrl";
import type { Category } from "@/type/categoryType";
import type { CategoryRow } from "@/type/db";
import { flattenCategoryHierarchy } from "@/lib/categories/hierarchy";

function mapCategory(row: CategoryRow): Category {
  return {
    _id: row.id,
    categoryName: row.name,
    categoryDescription: row.description,
    imageUrl: categoryImageUrl(row.image_path),
    parentId: row.parent_id ?? null,
    sort: row.sort,
    depth: 0,
    isDefault: row.is_default ?? false,
    categoryUrl: { current: row.slug },
  };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return flattenCategoryHierarchy(((data as CategoryRow[]) ?? []).map(mapCategory));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCategory(data as CategoryRow) : null;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCategory(data as CategoryRow) : null;
}
