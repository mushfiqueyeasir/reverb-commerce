import { notFound } from "next/navigation";
import { requireRole } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, BackLink } from "@/components/admin/PageHeader";
import type {
  CategoryRow,
  ProductRow,
  ProductImageRow,
  ProductVariantRow,
} from "@/type/db";
import { resolveSizeChart } from "@/lib/products/sizeChart";
import {
  ProductForm,
  type CategoryOption,
  type ProductFormData,
} from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "editor"]);
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const [
    { data: product },
    { data: images },
    { data: variants },
    { data: links },
    { data: allCategories },
  ] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .order("sort", { ascending: true }),
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("product_categories")
      .select("category_id")
      .eq("product_id", id),
    supabase.from("categories").select("id, name").order("sort"),
  ]);

  if (!product) notFound();
  const row = product as ProductRow;

  const categories: CategoryOption[] = (
    (allCategories ?? []) as Pick<CategoryRow, "id" | "name">[]
  ).map((c) => ({ id: c.id, name: c.name }));

  const formData: ProductFormData = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    sizing_mode: row.sizing_mode ?? "required",
    status: row.status,
    product_type: row.product_type,
    original_price: row.original_price,
    current_price: row.current_price,
    description: row.description ? { html: row.description.html } : null,
    size_chart: resolveSizeChart(row.size_chart, row.description),
    categoryIds: ((links ?? []) as { category_id: string }[]).map(
      (l) => l.category_id,
    ),
    images: ((images ?? []) as ProductImageRow[]).map((img) => ({
      path: img.path,
      alt: img.alt,
      isMain: img.is_main,
    })),
    variants: ((variants ?? []) as ProductVariantRow[]).map((v) => ({
      id: v.id,
      size: v.size ?? "",
      color: v.color ?? "",
      sku: v.sku ?? "",
      stock_quantity: String(v.stock_quantity),
      low_stock_threshold: String(v.low_stock_threshold),
    })),
  };

  return (
    <div>
      <BackLink href="/admin/products" label="Back to products" />
      <PageHeader title="Edit product" description={row.title} />
      <ProductForm product={formData} categories={categories} />
    </div>
  );
}
