import { requireRole } from "@/lib/admin/auth";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import { getCategories } from "@/utility/getCategory";
import { CategoryForm } from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  await requireRole(["admin", "editor"]);
  const categories = await getCategories();

  return (
    <div>
      <BackLink href="/admin/categories" label="Back to categories" />
      <PageHeader
        title="New category"
        description="Create a collection to group products."
      />
      <CategoryForm
        categories={categories.map((category) => ({
          id: category._id,
          name: category.categoryName,
          parentId: category.parentId,
          depth: category.depth,
          isDefault: category.isDefault,
        }))}
      />
    </div>
  );
}
