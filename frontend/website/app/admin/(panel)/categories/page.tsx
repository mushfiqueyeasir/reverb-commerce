import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { categoryImageUrl } from "@/utility/imageUrl";
import type { CategoryRow } from "@/type/db";
import { CategoriesTable, type CategoryTableRow } from "./CategoriesTable";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const supabase = await createSupabaseServerClient();

  const [categoriesResult, linksResult, productsResult] = await Promise.all([
    supabase.from("categories").select("*").order("sort", { ascending: true }),
    supabase.from("product_categories").select("category_id"),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (linksResult.error) throw linksResult.error;
  if (productsResult.error) throw productsResult.error;

  const categories = categoriesResult.data;
  const links = linksResult.data;
  const productCount = productsResult.count;

  const counts = new Map<string, number>();
  for (const link of (links ?? []) as { category_id: string }[]) {
    counts.set(link.category_id, (counts.get(link.category_id) ?? 0) + 1);
  }

  const rows: CategoryTableRow[] = ((categories ?? []) as CategoryRow[]).map(
    (c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sort: c.sort,
      isDefault: c.is_default ?? false,
      imageUrl: categoryImageUrl(c.image_path),
      productCount: c.is_default
        ? (productCount ?? 0)
        : (counts.get(c.id) ?? 0),
    }),
  );

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your catalog into browsable collections."
      >
        {writable && (
          <Button asChild className="rounded-full">
            <Link href="/admin/categories/new">
              <Plus className="size-4" /> New category
            </Link>
          </Button>
        )}
      </PageHeader>

      <CategoriesTable data={rows} canWrite={writable} />
    </div>
  );
}
