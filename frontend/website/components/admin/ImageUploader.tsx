"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Star, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import type { BucketName } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { createImageUploadUrl } from "@/app/admin/storage-actions";
import { useAdmin } from "./AdminContext";
import { ImageCropDialog } from "./ImageCropDialog";
import { buildStoragePublicUrl } from "@/utility/storageUrl";

export interface UploadedImage {
  path: string;
  alt?: string | null;
  isMain?: boolean;
}

const checkerboardStyle = {
  backgroundColor: "#1a1a1a",
  backgroundImage:
    "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
} as const;

export function ImageUploader({
  bucket,
  value,
  onChange,
  multiple = false,
  label = "Drop image here or click to browse",
  aspect,
  enableCrop = false,
  maxFiles,
  maxFileSizeMb,
  /** Single-image preview: cover = photos, wide = logos, square = favicon. */
  preview = "cover",
}: {
  bucket: BucketName;
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  multiple?: boolean;
  label?: string;
  /** Optional locked aspect (width/height). Omit for freeform crop. */
  aspect?: number;
  /** Enable crop dialog before upload (e.g. logo / favicon). */
  enableCrop?: boolean;
  /** Maximum total images when multiple uploads are enabled. */
  maxFiles?: number;
  /** Maximum source file size in megabytes. */
  maxFileSizeMb?: number;
  preview?: "cover" | "wide" | "square";
}) {
  const { storageBaseUrl } = useAdmin();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const singlePreview = !multiple && value[0] ? value[0] : null;
  const singleUrl = singlePreview
    ? buildStoragePublicUrl(storageBaseUrl, bucket, singlePreview.path)
    : null;
  const hasReachedFileLimit = Boolean(
    multiple && maxFiles && value.length >= maxFiles,
  );
  const uploadHint = [
    "PNG, JPG",
    multiple && maxFiles ? `max ${maxFiles} images` : null,
    maxFileSizeMb ? `${maxFileSizeMb} MB max${multiple ? " each" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    const uploaded: UploadedImage[] = [];

    try {
      for (const file of files) {
        const authorization = await createImageUploadUrl({
          bucket,
          contentType: file.type,
          size: file.size,
        });
        if (!authorization.path || !authorization.signedUrl) {
          toast.error(
            `Upload failed: ${authorization.error || "Unknown error"}`,
          );
          continue;
        }

        const body = new FormData();
        body.append("cacheControl", "3600");
        body.append("", file);
        const response = await fetch(authorization.signedUrl, {
          method: "PUT",
          body,
          headers: { "x-upsert": "false" },
        });
        if (!response.ok) {
          toast.error(`Upload failed: ${await response.text()}`);
          continue;
        }
        uploaded.push({ path: authorization.path, alt: file.name });
      }

      if (uploaded.length) {
        const next = multiple ? [...value, ...uploaded] : uploaded.slice(0, 1);
        if (multiple && !next.some((i) => i.isMain) && next.length) {
          next[0].isMain = true;
        }
        onChange(next);
        toast.success(
          `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`,
        );
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const startCropQueue = (files: File[]) => {
    let images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      toast.error("Please choose an image file.");
      return;
    }

    if (images.length !== files.length) {
      toast.error("Only image files can be uploaded.");
    }

    if (maxFileSizeMb) {
      const maxBytes = maxFileSizeMb * 1024 * 1024;
      const oversized = images.filter((file) => file.size > maxBytes);
      images = images.filter((file) => file.size <= maxBytes);
      if (oversized.length) {
        toast.error(
          oversized.length === 1
            ? `${oversized[0].name} exceeds the ${maxFileSizeMb} MB limit.`
            : `${oversized.length} images exceed the ${maxFileSizeMb} MB limit.`,
        );
      }
    }

    if (multiple && maxFiles) {
      const remaining = Math.max(0, maxFiles - value.length);
      if (remaining === 0) {
        toast.error(`You can upload a maximum of ${maxFiles} images.`);
        return;
      }
      if (images.length > remaining) {
        toast.error(
          `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be uploaded.`,
        );
        images = images.slice(0, remaining);
      }
    }

    if (!images.length) return;

    if (!enableCrop) {
      void uploadFiles(images);
      return;
    }

    const [first, ...rest] = images;
    const url = URL.createObjectURL(first);
    setPendingFiles(rest);
    setCropSrc(url);
  };

  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return;
    startCropQueue(Array.from(list));
  };

  const onCropComplete = async (file: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    await uploadFiles([file]);
    if (pendingFiles.length) {
      const [next, ...rest] = pendingFiles;
      setPendingFiles(rest);
      setCropSrc(URL.createObjectURL(next));
    }
  };

  const onCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (uploading) return;
      handleFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploading, enableCrop, value, multiple, maxFiles, maxFileSizeMb],
  );

  const remove = (path: string) => {
    const next = value.filter((i) => i.path !== path);
    if (multiple && next.length && !next.some((i) => i.isMain)) {
      next[0].isMain = true;
    }
    onChange(next);
  };

  const setMain = (path: string) => {
    onChange(value.map((i) => ({ ...i, isMain: i.path === path })));
  };

  const openPicker = () => {
    if (!hasReachedFileLimit) inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Single-image: preview + upload merged in one drop zone */}
      {!multiple ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && openPicker()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!uploading) openPicker();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={onDrop}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-dashed text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            preview === "square"
              ? "w-40 sm:w-44"
              : preview === "cover"
                ? "w-full max-w-xl"
                : "w-full max-w-md",
            dragOver
              ? "border-primary bg-primary/10"
              : "border-border bg-background/40 hover:border-primary/40",
            uploading && "pointer-events-none opacity-60",
            !singleUrl &&
              (preview === "square"
                ? "aspect-square p-4"
                : preview === "cover"
                  ? "aspect-[4/3] min-h-52 p-4 sm:min-h-64"
                  : "px-4 py-10"),
          )}
          style={singleUrl && enableCrop ? checkerboardStyle : undefined}
        >
          {uploading ? (
            <div
              className={cn(
                "relative overflow-hidden",
                preview === "square"
                  ? "aspect-square"
                  : preview === "cover"
                    ? "aspect-[4/3] min-h-52 sm:min-h-64"
                    : "aspect-[5/2]",
              )}
            >
              <Skeleton className="absolute inset-0 rounded-none" />
            </div>
          ) : singleUrl ? (
            preview === "cover" ? (
              <div className="relative aspect-[4/3] min-h-52 w-full sm:min-h-64">
                <Image
                  src={singleUrl}
                  alt={singlePreview?.alt ?? "Uploaded image"}
                  fill
                  sizes="(max-width: 640px) 100vw, 576px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 pb-2.5 pt-8">
                  <span className="truncate text-xs text-white/90">
                    {dragOver ? "Drop to replace" : "Replace"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(singlePreview!.path);
                    }}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-white/30 bg-black/40 px-3 py-1.5 text-xs text-white transition hover:border-destructive hover:text-destructive"
                    aria-label="Remove image"
                  >
                    <X className="size-3" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "relative flex flex-col",
                  preview === "square" ? "aspect-square" : "aspect-[5/2]",
                )}
              >
                <div className="flex flex-1 items-center justify-center p-4">
                  <Image
                    src={singleUrl}
                    alt={singlePreview?.alt ?? "Uploaded image"}
                    width={preview === "square" ? 160 : 400}
                    height={preview === "square" ? 160 : 160}
                    className={cn(
                      "object-contain",
                      preview === "square"
                        ? "size-full max-h-28 max-w-28"
                        : "max-h-16 w-auto sm:max-h-20",
                    )}
                  />
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 bg-background/85 px-2.5 py-2 backdrop-blur-md">
                  <span className="truncate text-[10px] text-muted-foreground sm:text-xs">
                    {dragOver ? "Drop to replace" : "Replace"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(singlePreview!.path);
                    }}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive hover:text-destructive"
                    aria-label="Remove image"
                  >
                    <X className="size-3" />
                    Remove
                  </button>
                </div>
              </div>
            )
          ) : (
            <div
              className={cn(
                "flex h-full flex-col items-center justify-center gap-2 text-center",
                dragOver ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="grid size-9 place-items-center rounded-full bg-white/5">
                {dragOver ? (
                  <ImagePlus className="size-4 text-primary" />
                ) : (
                  <Upload className="size-4" />
                )}
              </span>
              <span className="px-1 text-xs font-medium leading-snug sm:text-sm">
                {dragOver
                  ? enableCrop
                    ? "Drop to crop"
                    : "Drop to upload"
                  : label}
              </span>
              {preview !== "square" && (
                <span className="text-xs text-muted-foreground">
                  {enableCrop ? `${uploadHint} · freeform crop` : uploadHint}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading || hasReachedFileLimit}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={onDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-sm transition-colors disabled:opacity-60",
              dragOver
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {uploading ? (
              <Skeleton className="size-10 rounded-full" />
            ) : (
              <span className="grid size-10 place-items-center rounded-full bg-white/5">
                {dragOver ? (
                  <ImagePlus className="size-4 text-primary" />
                ) : (
                  <Upload className="size-4" />
                )}
              </span>
            )}
            {uploading ? (
              <div className="flex w-full max-w-xs flex-col items-center gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : (
              <>
                <span className="font-medium">
                  {hasReachedFileLimit
                    ? `Maximum ${maxFiles} images reached`
                    : dragOver
                      ? "Drop to upload"
                      : value.length
                        ? "Add more images"
                        : label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {uploadHint}
                </span>
              </>
            )}
          </button>

          {value.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {value.map((img) => {
                const url = buildStoragePublicUrl(
                  storageBaseUrl,
                  bucket,
                  img.path,
                );
                return (
                  <div
                    key={img.path}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-xl border bg-muted",
                      img.isMain
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border",
                    )}
                  >
                    {url && (
                      <Image
                        src={url}
                        alt={img.alt ?? ""}
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => remove(img.path)}
                      className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition-opacity md:size-7 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <X className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMain(img.path)}
                      className={cn(
                        "absolute left-1.5 top-1.5 flex size-9 items-center justify-center rounded-full text-white transition-opacity md:size-7",
                        img.isMain
                          ? "bg-primary"
                          : "bg-black/70 opacity-100 md:opacity-0 md:group-hover:opacity-100",
                      )}
                      aria-label="Set as main image"
                      title="Set as main image"
                    >
                      <Star className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ImageCropDialog
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        aspect={aspect}
        outputMimeType="image/png"
        onCancel={onCropCancel}
        onComplete={onCropComplete}
      />
    </div>
  );
}
