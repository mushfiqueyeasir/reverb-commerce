import { notFound } from "next/navigation";
import { requireRole } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import type { CategoryRow } from "@/type/db";
import { getCategories } from "@/utility/getCategory";
import { CategoryForm } from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "editor"]);
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const [{ data }, categories] = await Promise.all([
    supabase.from("categories").select("*").eq("id", id).maybeSingle(),
    getCategories(),
  ]);

  if (!data) notFound();
  const category = data as CategoryRow;

  return (
    <div>
      <BackLink href="/admin/categories" label="Back to categories" />
      <PageHeader title="Edit category" description={category.name} />
      <CategoryForm
        category={category}
        categories={categories.map((item) => ({
          id: item._id,
          name: item.categoryName,
          parentId: item.parentId,
          depth: item.depth,
          isDefault: item.isDefault,
        }))}
      />
    </div>
  );
}
