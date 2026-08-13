import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/utility/getCategory";
import { getDescendantIds } from "@/lib/categories/hierarchy";
import { CategoriesTable, type CategoryTableRow } from "./CategoriesTable";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const supabase = await createSupabaseServerClient();

  const [categories, linksResult, productsResult] = await Promise.all([
    getCategories(),
    supabase.from("product_categories").select("category_id, product_id"),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  if (linksResult.error) throw linksResult.error;
  if (productsResult.error) throw productsResult.error;

  const productsByCategory = new Map<string, Set<string>>();
  for (const link of (linksResult.data ?? []) as {
    category_id: string;
    product_id: string;
  }[]) {
    const productIds = productsByCategory.get(link.category_id) ?? new Set();
    productIds.add(link.product_id);
    productsByCategory.set(link.category_id, productIds);
  }

  const rows: CategoryTableRow[] = categories.map((category) => {
    const productIds = new Set<string>();
    for (const id of getDescendantIds(categories, category._id)) {
      for (const productId of productsByCategory.get(id) ?? []) {
        productIds.add(productId);
      }
    }
    return {
      id: category._id,
      name: category.categoryName,
      slug: category.categoryUrl.current,
      sort: category.sort,
      depth: category.depth,
      parentId: category.parentId,
      hasChildren: categories.some(
        (candidate) => candidate.parentId === category._id,
      ),
      isDefault: category.isDefault,
      imageUrl: category.imageUrl,
      productCount: category.isDefault
        ? (productsResult.count ?? 0)
        : productIds.size,
    };
  });

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
