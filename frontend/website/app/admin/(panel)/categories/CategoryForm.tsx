"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/admin/ImageUploader";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  FormActions,
  FormField,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BUCKETS } from "@/lib/supabase/config";
import { slugify } from "@/lib/admin/format";
import type { CategoryRow } from "@/type/db";
import { saveCategory } from "./actions";

export interface CategoryParentOption {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  isDefault: boolean;
}

export function CategoryForm({
  category,
  categories,
}: {
  category?: CategoryRow;
  categories: CategoryParentOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [description, setDescription] = useState(category?.description ?? "");
  const [categoryType, setCategoryType] = useState<
    "primary" | "subcategory" | null
  >(
    category
      ? category.parent_id
        ? "subcategory"
        : "primary"
      : null,
  );
  const [parentId, setParentId] = useState(category?.parent_id ?? "");
  const [image, setImage] = useState<UploadedImage[]>(
    category?.image_path ? [{ path: category.image_path }] : [],
  );
  const [remoteImageUrl, setRemoteImageUrl] = useState(
    category?.image_path && /^https:\/\//i.test(category.image_path)
      ? category.image_path
      : "",
  );
  const unavailableParents = new Set(category ? [category.id] : []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const option of categories) {
      if (
        option.parentId &&
        unavailableParents.has(option.parentId) &&
        !unavailableParents.has(option.id)
      ) {
        unavailableParents.add(option.id);
        changed = true;
      }
    }
  }
  const parentOptions = categories.filter(
    (option) =>
      !option.isDefault &&
      !option.parentId &&
      !unavailableParents.has(option.id),
  );

  const chooseCategoryType = (type: "primary" | "subcategory") => {
    setCategoryType(type);
    if (type === "primary") setParentId("");
  };

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (categoryType === "subcategory" && !parentId) {
      toast.error("Select a parent category.");
      return;
    }
    startTransition(async () => {
      const res = await saveCategory({
        id: category?.id,
        name,
        slug: slug.trim() || slugify(name),
        description,
        parent_id:
          category?.is_default || categoryType === "primary"
            ? null
            : parentId || null,
        image_path: image[0]?.path ?? null,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(category ? "Category updated" : "Category created");
      router.push("/admin/categories");
      router.refresh();
    });
  };

  if (categoryType === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <AdminCard
          title="Choose category type"
          description="Decide how this category should appear in the catalog."
        >
          <CategoryTypeChooser
            selected={null}
            onSelect={chooseCategoryType}
          />
        </AdminCard>
        <FormActions>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/categories")}
            className="rounded-full px-6"
          >
            Cancel
          </Button>
        </FormActions>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {!category?.is_default ? (
        <AdminCard
          title="Category type"
          description="Primary categories appear at the top level. Subcategories require a parent."
        >
          <CategoryTypeChooser
            selected={categoryType}
            onSelect={chooseCategoryType}
          />
        </AdminCard>
      ) : null}
      <AdminCard
        title="Category"
        description="Name, slug, and storefront image."
      >
        <div className="space-y-5">
          <FormField label="Name" htmlFor="name">
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Helmets"
              className={adminInputClass}
            />
          </FormField>

          <FormField label="Slug" htmlFor="slug">
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="helmets"
              className={adminInputClass}
            />
          </FormField>

          {categoryType === "subcategory" ? (
            <FormField
              label="Parent category"
              htmlFor="parent_id"
              hint="Choose the primary category this belongs to."
            >
              <select
                id="parent_id"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                className={`${adminSelectClass} w-full border px-3 text-sm`}
              >
                <option value="">Select a parent category</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${"— ".repeat(option.depth)}${option.name}`}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          <FormField
            label="Description"
            htmlFor="description"
            hint="Optional description shown on the storefront."
          >
            <Textarea
              id="description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short category blurb…"
              className={adminTextareaClass}
            />
          </FormField>

          <FormField
            label="Remote image URL"
            htmlFor="remote_image_url"
            hint="Use an HTTPS image URL to avoid consuming store storage. Uploading below will replace it."
          >
            <Input
              id="remote_image_url"
              type="url"
              value={remoteImageUrl}
              placeholder="https://images.example.com/category.jpg"
              className={adminInputClass}
              onChange={(event) => {
                const value = event.target.value;
                setRemoteImageUrl(value);
                setImage(value.trim() ? [{ path: value.trim() }] : []);
              }}
            />
          </FormField>

          <FormField label="Upload image">
            <ImageUploader
              bucket={BUCKETS.category}
              value={image}
              onChange={(images) => {
                setImage(images);
                if (images[0] && !/^https:\/\//i.test(images[0].path)) {
                  setRemoteImageUrl("");
                }
                if (!images.length) setRemoteImageUrl("");
              }}
              label="Upload category image"
              maxFileSizeMb={4}
              preview="cover"
            />
          </FormField>
        </div>
      </AdminCard>

      <FormActions>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/categories")}
          disabled={pending}
          className="rounded-full px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={pending}
          className="rounded-full px-6"
        >
          {pending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {category ? "Save changes" : "Create category"}
        </Button>
      </FormActions>
    </div>
  );
}

function CategoryTypeChooser({
  selected,
  onSelect,
}: {
  selected: "primary" | "subcategory" | null;
  onSelect: (type: "primary" | "subcategory") => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        aria-pressed={selected === "primary"}
        onClick={() => onSelect("primary")}
        className={`rounded-xl border p-5 text-left transition ${
          selected === "primary"
            ? "border-primary bg-primary/10 ring-1 ring-primary"
            : "border-border bg-background hover:border-primary/50"
        }`}
      >
        <span className="font-display text-base font-semibold text-foreground">
          Primary category
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          A top-level category displayed directly in category navigation.
        </span>
      </button>
      <button
        type="button"
        aria-pressed={selected === "subcategory"}
        onClick={() => onSelect("subcategory")}
        className={`rounded-xl border p-5 text-left transition ${
          selected === "subcategory"
            ? "border-primary bg-primary/10 ring-1 ring-primary"
            : "border-border bg-background hover:border-primary/50"
        }`}
      >
        <span className="font-display text-base font-semibold text-foreground">
          Subcategory
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          A child category that must belong to an existing parent.
        </span>
      </button>
    </div>
  );
}
