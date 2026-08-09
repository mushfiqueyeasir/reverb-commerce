import { requireRole } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import type { CategoryRow } from "@/type/db";
import { ProductForm, type CategoryOption } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireRole(["admin", "editor"]);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort", { ascending: true });

  const categories: CategoryOption[] = (
    (data ?? []) as Pick<CategoryRow, "id" | "name" | "is_default">[]
  )
    .filter((c) => !c.is_default)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <BackLink href="/admin/products" label="Back to products" />
      <PageHeader
        title="New product"
        description="Add a product with imagery, pricing and variants."
      />
      <ProductForm categories={categories} />
    </div>
  );
}
