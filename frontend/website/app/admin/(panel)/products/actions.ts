"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import { buildDescriptionPayload } from "@/lib/products/sizeChart";
import { chooseUniqueProductSlug, productSlugBase } from "@/lib/products/slug";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BUCKETS } from "@/lib/supabase/config";

export interface ProductImageInput {
  path: string;
  alt?: string | null;
  isMain?: boolean;
}

export interface ProductVariantInput {
  id?: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface ProductSizeChartInput {
  size: string;
  chest: string;
  length: string;
}

export interface ProductInput {
  id?: string;
  title: string;
  sizing_mode: "none" | "required";
  status: "active" | "draft" | "archived";
  product_type?: string | null;
  original_price: number;
  current_price: number;
  description: { html: string } | null;
  size_chart: ProductSizeChartInput[] | null;
  categoryIds: string[];
  images: ProductImageInput[];
  variants: ProductVariantInput[];
}

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

async function removeUnreferencedProductImages(paths: string[]) {
  if (!paths.length) return;
  const admin = createSupabaseAdminClient();
  const { data: references, error: referenceError } = await admin
    .from("product_images")
    .select("path")
    .in("path", paths);
  if (referenceError) {
    // eslint-disable-next-line no-console
    console.error("Could not verify product image references", referenceError);
    return;
  }

  const referencedPaths = new Set(
    (references ?? []).map((image) => image.path as string),
  );
  const removablePaths = paths.filter((path) => !referencedPaths.has(path));
  if (!removablePaths.length) return;

  const { error } = await admin.storage
    .from(BUCKETS.product)
    .remove(removablePaths);
  // Cleanup is best-effort after the database save has committed.
  // eslint-disable-next-line no-console
  if (error) console.error("Could not remove product images", error);
}

async function findAvailableProductSlug(
  supabase: SupabaseServerClient,
  title: string,
): Promise<{ slug?: string; error?: string }> {
  const base = productSlugBase(title);
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .like("slug", `${base}%`);

  if (error) return { error: error.message };
  return {
    slug: chooseUniqueProductSlug(
      title,
      (data ?? []).map((row) => row.slug as string),
    ),
  };
}

export async function suggestProductSlug(
  title: string,
): Promise<{ slug?: string; error?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!title.trim()) return { error: "Title is required." };

  const supabase = await createSupabaseServerClient();
  return findAvailableProductSlug(supabase, title);
}

export async function saveProduct(
  input: ProductInput,
): Promise<{ error?: string; id?: string; slug?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role))
    return { error: "You do not have permission to do this." };

  if (!input.title?.trim()) return { error: "Title is required." };
  if (input.sizing_mode === "required") {
    if (
      !input.variants.length ||
      input.variants.some((variant) => !variant.size?.trim())
    ) {
      return { error: "Add a size to every variant." };
    }
  } else if (input.variants.length !== 1 || input.variants[0]?.size?.trim()) {
    return { error: "A size-free product requires one general inventory row." };
  }
  if (input.variants.some((variant) => !variant.sku?.trim())) {
    return { error: "Every variation requires an SKU." };
  }
  const skus = input.variants
    .map((variant) => variant.sku?.trim().toLowerCase())
    .filter((sku): sku is string => Boolean(sku));
  if (new Set(skus).size !== skus.length) {
    return { error: "Every variation must have a unique SKU." };
  }
  if (input.images.length > 5) {
    return { error: "A product can have a maximum of 5 images." };
  }

  const supabase = await createSupabaseServerClient();
  let productSlug: string;

  if (input.id) {
    const { data: existingProduct, error } = await supabase
      .from("products")
      .select("slug")
      .eq("id", input.id)
      .single();
    if (error || !existingProduct) {
      return { error: error?.message ?? "Product not found." };
    }
    productSlug = existingProduct.slug as string;
  } else {
    const available = await findAvailableProductSlug(supabase, input.title);
    if (!available.slug) {
      return { error: available.error ?? "Failed to generate product slug." };
    }
    productSlug = available.slug;
  }

  // Keep existing sort on edit; append new products at the end (when sort exists).
  let nextSort: number | undefined;
  if (!input.id) {
    const { data: maxRow, error: sortProbe } = await supabase
      .from("products")
      .select("sort")
      .order("sort", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sortProbe) {
      nextSort = ((maxRow?.sort as number | undefined) ?? 0) + 10;
    }
  }

  // 1. Upsert the product row.
  const sizeChart =
    input.size_chart && input.size_chart.length > 0
      ? input.size_chart.map((row) => ({
          size: row.size.trim(),
          chest: String(row.chest).trim(),
          length: String(row.length).trim(),
        }))
      : null;

  const persistProductRow = async (slug: string) => {
    const productPayload = {
      ...(input.id ? { id: input.id } : {}),
      title: input.title.trim(),
      slug,
      sizing_mode: input.sizing_mode,
      status: input.status,
      product_type: input.product_type?.trim() || null,
      original_price: Number(input.original_price) || 0,
      current_price: Number(input.current_price) || 0,
      description: buildDescriptionPayload(input.description, sizeChart, false),
      size_chart: input.sizing_mode === "required" ? sizeChart : null,
      ...(nextSort != null ? { sort: nextSort } : {}),
      updated_at: new Date().toISOString(),
    };

    let result = await supabase
      .from("products")
      .upsert(productPayload)
      .select("id")
      .single();

    // Column missing: store size chart inside description jsonb (already exists).
    if (result.error && /size_chart/i.test(result.error.message)) {
      const withoutChart = {
        ...productPayload,
        description: buildDescriptionPayload(
          input.description,
          input.sizing_mode === "required" ? sizeChart : null,
          true,
        ),
      };
      delete (withoutChart as { size_chart?: unknown }).size_chart;
      delete (withoutChart as { sort?: unknown }).sort;
      result = await supabase
        .from("products")
        .upsert(withoutChart)
        .select("id")
        .single();
    }

    return result;
  };

  let { data: product, error: productError } =
    await persistProductRow(productSlug);

  // The unique database constraint is authoritative if two creates race.
  for (
    let attempt = 0;
    !input.id && productError?.code === "23505" && attempt < 3;
    attempt += 1
  ) {
    const available = await findAvailableProductSlug(supabase, input.title);
    if (!available.slug) {
      return { error: available.error ?? "Failed to generate product slug." };
    }
    productSlug = available.slug;
    ({ data: product, error: productError } =
      await persistProductRow(productSlug));
  }

  if (productError) return { error: productError.message };
  if (!product) return { error: "Failed to save product." };
  const productId = product.id as string;

  // 2. Sync category links (delete + insert).
  const { error: delCatError } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", productId);
  if (delCatError) return { error: delCatError.message };

  if (input.categoryIds.length) {
    const catRows = input.categoryIds.map((category_id) => ({
      product_id: productId,
      category_id,
    }));
    const { error } = await supabase.from("product_categories").insert(catRows);
    if (error) return { error: error.message };
  }

  // 3. Sync variants: delete removed ones, then upsert the rest.
  const keepIds = input.variants
    .map((v) => v.id)
    .filter((id): id is string => Boolean(id));

  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  const toDelete = ((existing ?? []) as { id: string }[])
    .filter((e) => !keepIds.includes(e.id))
    .map((e) => e.id);

  if (toDelete.length) {
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .in("id", toDelete);
    if (error) return { error: error.message };
  }

  if (input.variants.length) {
    const variantRows = input.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      product_id: productId,
      size: v.size?.trim() || null,
      color: v.color?.trim() || null,
      sku: v.sku?.trim() || null,
      stock_quantity: Number(v.stock_quantity) || 0,
      low_stock_threshold: Number(v.low_stock_threshold) || 0,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("product_variants")
      .upsert(variantRows);
    if (error?.code === "23505") {
      if (!input.id) {
        await supabase.from("products").delete().eq("id", productId);
      }
      return {
        error: /sku/i.test(error.message)
          ? "That SKU is already used by another variation."
          : "Two variations cannot have the same size and color.",
      };
    }
    if (error) return { error: error.message };
  }

  // 4. Sync images last so a category or variant failure cannot leave newly
  // uploaded objects referenced by a partially saved product.
  const { data: previousImages, error: previousImagesError } = await supabase
    .from("product_images")
    .select("path")
    .eq("product_id", productId);
  if (previousImagesError) return { error: previousImagesError.message };
  const retainedImagePaths = new Set(input.images.map((image) => image.path));
  const staleImagePaths = (previousImages ?? [])
    .map((image) => image.path as string)
    .filter((path) => !retainedImagePaths.has(path));

  const { error: delImgError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (delImgError) return { error: delImgError.message };

  if (input.images.length) {
    const hasMain = input.images.some((img) => img.isMain);
    const imageRows = input.images.map((img, i) => ({
      product_id: productId,
      path: img.path,
      alt: img.alt ?? null,
      is_main: img.isMain ?? (!hasMain && i === 0),
      sort: i,
    }));
    const { error } = await supabase.from("product_images").insert(imageRows);
    if (error) return { error: error.message };
  }

  if (staleImagePaths.length) {
    await removeUnreferencedProductImages(staleImagePaths);
  }

  const isCreate = !input.id;
  await writeAuditLog({
    actor: s,
    action: isCreate ? "create" : "update",
    entity: "product",
    entityId: productId,
    summary: isCreate
      ? `Created product "${input.title.trim()}"`
      : `Updated product "${input.title.trim()}"`,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/product");
  revalidatePath(`/product/${productSlug}`);
  return { id: productId, slug: productSlug };
}

export async function deleteProduct(
  id: string,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role))
    return { error: "You do not have permission to do this." };

  const supabase = await createSupabaseServerClient();
  const { data: productRow } = await supabase
    .from("products")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  const { data: imageRows } = await supabase
    .from("product_images")
    .select("path")
    .eq("product_id", id);

  // product_images / product_variants / product_categories cascade on delete.
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  const imagePaths = (imageRows ?? []).map((image) => image.path as string);
  if (imagePaths.length) {
    await removeUnreferencedProductImages(imagePaths);
  }

  await writeAuditLog({
    actor: s,
    action: "delete",
    entity: "product",
    entityId: id,
    summary: productRow?.title
      ? `Deleted product "${productRow.title}"`
      : `Deleted product ${id}`,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

export async function reorderProducts(
  orderedIds: string[],
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!orderedIds.length) return { error: "Invalid product order." };

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("products")
      .update({ sort: (i + 1) * 10, updated_at: now })
      .eq("id", orderedIds[i]);
    if (error) {
      if (/column .*sort.* does not exist/i.test(error.message)) {
        return {
          error:
            "Product ordering needs a database update. Run migration 0009_product_sort.sql.",
        };
      }
      return { error: error.message };
    }
  }

  await writeAuditLog({
    actor: s,
    action: "reorder",
    entity: "product",
    summary: "Reordered products",
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/product");
}
