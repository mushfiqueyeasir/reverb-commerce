import { requireRole } from "@/lib/admin/auth";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import { getCategories } from "@/utility/getCategory";
import { ProductForm, type CategoryOption } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireRole(["admin", "editor"]);
  const categoryRows = await getCategories();
  const categories: CategoryOption[] = categoryRows
    .filter((category) => !category.isDefault)
    .map((category) => ({
      id: category._id,
      name: category.categoryName,
      parentId: category.parentId,
      depth: category.depth,
    }));

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
