"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BUCKETS } from "@/lib/supabase/config";

async function removeUnreferencedReviewImages(paths: string[]) {
  if (!paths.length) return;
  const admin = createSupabaseAdminClient();
  const { data: references, error: referenceError } = await admin
    .from("reviews")
    .select("image_path")
    .in("image_path", paths);
  if (referenceError) {
    // eslint-disable-next-line no-console
    console.error("Could not verify review image references", referenceError);
    return;
  }

  const referencedPaths = new Set(
    (references ?? []).map((review) => review.image_path as string),
  );
  const removablePaths = paths.filter((path) => !referencedPaths.has(path));
  if (!removablePaths.length) return;

  const { error } = await admin.storage
    .from(BUCKETS.review)
    .remove(removablePaths);
  // Cleanup is best-effort after the database save has committed.
  // eslint-disable-next-line no-console
  if (error) console.error("Could not remove review images", error);
}

export interface ReviewInput {
  id?: string;
  customer_name: string | null;
  image_path: string | null;
  rating: number | null;
  body: string | null;
  product_id: string | null;
  is_published: boolean;
}

export async function saveReview(
  input: ReviewInput,
): Promise<{ error?: string; id?: string }> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  if (!input.customer_name || !input.customer_name.trim()) {
    return { error: "Customer name is required." };
  }
  if (input.rating != null && (input.rating < 1 || input.rating > 5)) {
    return { error: "Rating must be between 1 and 5." };
  }

  const supabase = await createSupabaseServerClient();
  let previousImagePath: string | null = null;
  if (input.id) {
    const { data: previousReview, error: previousReviewError } = await supabase
      .from("reviews")
      .select("image_path")
      .eq("id", input.id)
      .single();
    if (previousReviewError) return { error: previousReviewError.message };
    previousImagePath = (previousReview.image_path as string | null) ?? null;
  }
  const payload = {
    customer_name: input.customer_name.trim(),
    image_path: input.image_path,
    rating: input.rating,
    body: input.body,
    product_id: input.product_id,
    is_published: input.is_published,
  };

  const query = input.id
    ? supabase.from("reviews").update(payload).eq("id", input.id)
    : supabase.from("reviews").insert(payload);

  const { data, error } = await query.select("id").single();
  if (error) return { error: error.message };

  const reviewId = data.id as string;
  if (previousImagePath && previousImagePath !== input.image_path) {
    await removeUnreferencedReviewImages([previousImagePath]);
  }
  await writeAuditLog({
    actor: s,
    action: input.id ? "update" : "create",
    entity: "review",
    entityId: reviewId,
    summary: input.id
      ? `Updated review by ${input.customer_name.trim()}`
      : `Created review by ${input.customer_name.trim()}`,
  });

  revalidatePath("/admin/reviews");
  return { id: reviewId };
}

export async function deleteReview(
  id: string,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: reviewRow } = await supabase
    .from("reviews")
    .select("customer_name, image_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { error: error.message };

  if (reviewRow?.image_path) {
    await removeUnreferencedReviewImages([reviewRow.image_path as string]);
  }

  await writeAuditLog({
    actor: s,
    action: "delete",
    entity: "review",
    entityId: id,
    summary: reviewRow?.customer_name
      ? `Deleted review by ${reviewRow.customer_name}`
      : `Deleted review ${id}`,
  });

  revalidatePath("/admin/reviews");
}

export async function toggleReview(
  id: string,
  isPublished: boolean,
): Promise<{ error?: string } | void> {
  const s = await requireAdminSession();
  if (!canWrite(s.role)) {
    return { error: "You do not have permission to do this." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: reviewRow } = await supabase
    .from("reviews")
    .select("customer_name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("reviews")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) return { error: error.message };

  const reviewLabel = reviewRow?.customer_name?.trim() || id;
  await writeAuditLog({
    actor: s,
    action: "toggle",
    entity: "review",
    entityId: id,
    summary: `${isPublished ? "Published" : "Unpublished"} review by ${reviewLabel}`,
    metadata: { is_published: isPublished },
  });

  revalidatePath("/admin/reviews");
}
