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
  const [parentId, setParentId] = useState(category?.parent_id ?? "");
  const [image, setImage] = useState<UploadedImage[]>(
    category?.image_path ? [{ path: category.image_path }] : [],
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
    (option) => !option.isDefault && !unavailableParents.has(option.id),
  );

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    startTransition(async () => {
      const res = await saveCategory({
        id: category?.id,
        name,
        slug: slug.trim() || slugify(name),
        description,
        parent_id: category?.is_default ? null : parentId || null,
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

  return (
    <div className="mx-auto max-w-2xl space-y-8">
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

          <FormField
            label="Parent category"
            htmlFor="parent_id"
            hint="Leave empty to create a top-level category."
          >
            <select
              id="parent_id"
              value={category?.is_default ? "" : parentId}
              disabled={category?.is_default}
              onChange={(event) => setParentId(event.target.value)}
              className={`${adminSelectClass} w-full border px-3 text-sm`}
            >
              <option value="">Top level</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {`${"— ".repeat(option.depth)}${option.name}`}
                </option>
              ))}
            </select>
          </FormField>

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

          <FormField label="Image">
            <ImageUploader
              bucket={BUCKETS.category}
              value={image}
              onChange={setImage}
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
