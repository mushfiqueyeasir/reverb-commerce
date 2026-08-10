"use server";

import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/admin/auth";
import { BUCKETS, type BucketName } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_OPTIMIZED_UPLOAD_BYTES = 4 * 1024 * 1024;
const OPTIMIZED_BUCKETS = new Set<BucketName>([
  BUCKETS.product,
  BUCKETS.review,
]);
const EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type UploadRequest = {
  bucket: BucketName;
  contentType: string;
  size: number;
  fileName?: string;
};

type UploadResult = {
  path?: string;
  signedUrl?: string;
  error?: string;
};

export async function createImageUploadUrl(
  input: UploadRequest,
): Promise<UploadResult> {
  await requireRole(["admin", "editor"]);

  if (!Object.values(BUCKETS).includes(input.bucket)) {
    return { error: "Unknown storage bucket." };
  }
  const extension = EXTENSIONS[input.contentType.toLowerCase()];
  if (!extension) return { error: "Unsupported image type." };
  if (
    OPTIMIZED_BUCKETS.has(input.bucket) &&
    input.contentType.toLowerCase() !== "image/webp"
  ) {
    return { error: "Product and review images must be optimized WebP files." };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { error: "The image is empty." };
  }
  const maxBytes = OPTIMIZED_BUCKETS.has(input.bucket)
    ? MAX_OPTIMIZED_UPLOAD_BYTES
    : MAX_UPLOAD_BYTES;
  if (input.size > maxBytes) {
    if (OPTIMIZED_BUCKETS.has(input.bucket)) {
      return { error: "Optimized images must be 4 MB or smaller." };
    }
    return { error: "Images must be 10 MB or smaller." };
  }

  const requestedStem = input.fileName?.replace(/\.[^.]+$/, "") ?? "";
  const safeStem = requestedStem
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const path = safeStem
    ? `${safeStem}-${randomUUID()}.${extension}`
    : `${randomUUID()}.${extension}`;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(input.bucket)
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl) {
    return { error: error?.message || "Could not authorize the upload." };
  }
  return { path, signedUrl: data.signedUrl };
}

export async function deleteImageObjects(input: {
  bucket: BucketName;
  paths: string[];
}): Promise<{ error?: string }> {
  await requireRole(["admin", "editor"]);

  if (!OPTIMIZED_BUCKETS.has(input.bucket)) {
    return {
      error: "Image cleanup is only available for product and review images.",
    };
  }
  const paths = [...new Set(input.paths)].filter(
    (path) =>
      path.length > 0 &&
      path.length <= 180 &&
      !path.startsWith("/") &&
      !path.includes("..") &&
      path.toLowerCase().endsWith(".webp"),
  );
  if (!paths.length) return {};
  if (paths.length > 10) return { error: "Too many images to remove at once." };

  const admin = createSupabaseAdminClient();
  const references =
    input.bucket === BUCKETS.product
      ? await admin.from("product_images").select("path").in("path", paths)
      : await admin
          .from("reviews")
          .select("image_path")
          .in("image_path", paths);
  if (references.error) return { error: references.error.message };

  const referencedPaths = new Set(
    (references.data ?? []).map((row) =>
      "path" in row ? (row.path as string) : (row.image_path as string),
    ),
  );
  const unreferencedPaths = paths.filter((path) => !referencedPaths.has(path));
  if (!unreferencedPaths.length) return {};

  const { error } = await admin.storage
    .from(input.bucket)
    .remove(unreferencedPaths);
  return error ? { error: error.message } : {};
}
