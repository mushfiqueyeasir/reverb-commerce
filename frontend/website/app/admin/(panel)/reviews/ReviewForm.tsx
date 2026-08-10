"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { ReviewRow } from "@/type/db";
import { BUCKETS } from "@/lib/supabase/config";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveReview } from "./actions";
import { deleteImageObjects } from "@/app/admin/storage-actions";

export interface ProductOption {
  id: string;
  title: string;
}

const NO_PRODUCT = "__none__";

export function ReviewForm({
  review,
  products,
}: {
  review?: ReviewRow;
  products: ProductOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [imageBusy, setImageBusy] = useState(false);

  const [customerName, setCustomerName] = useState(review?.customer_name ?? "");
  const [rating, setRating] = useState(
    review?.rating != null ? String(review.rating) : "5",
  );
  const [body, setBody] = useState(review?.body ?? "");
  const [productId, setProductId] = useState(review?.product_id ?? NO_PRODUCT);
  const [isPublished, setIsPublished] = useState(review?.is_published ?? true);
  const [images, setImages] = useState<UploadedImage[]>(
    review?.image_path ? [{ path: review.image_path }] : [],
  );

  const cancel = async () => {
    if (imageBusy) return;
    const unsavedPaths = images
      .filter((image) => image.isNew)
      .map((image) => image.path);
    if (unsavedPaths.length) {
      setImageBusy(true);
      try {
        const result = await deleteImageObjects({
          bucket: BUCKETS.review,
          paths: unsavedPaths,
        });
        if (result.error)
          toast.error("The unused review image could not be removed.");
      } catch {
        toast.error("The unused review image could not be removed.");
      }
    }
    router.push("/admin/reviews");
  };

  const submit = () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    startTransition(async () => {
      const res = await saveReview({
        id: review?.id,
        customer_name: customerName.trim(),
        image_path: images[0]?.path ?? null,
        rating: Number(rating),
        body: body.trim() || null,
        product_id: productId === NO_PRODUCT ? null : productId,
        is_published: isPublished,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(review ? "Review updated" : "Review created");
      router.push("/admin/reviews");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <AdminCard
            title="Review"
            description="Customer feedback shown on the storefront."
          >
            <div className="space-y-5">
              <FormField label="Customer name" htmlFor="customer_name">
                <Input
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jane Doe"
                  className={adminInputClass}
                />
              </FormField>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Rating">
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger className={adminSelectClass}>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} / 5
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Product (optional)">
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger className={adminSelectClass}>
                      <SelectValue placeholder="No product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PRODUCT}>No product</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="Review" htmlFor="body">
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="What did the customer say?"
                  className={adminTextareaClass}
                />
              </FormField>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-5">
          <AdminCard title="Photo">
            <ImageUploader
              bucket={BUCKETS.review}
              value={images}
              onChange={setImages}
              label="Upload photo"
              maxFileSizeMb={4}
              optimizeToWebp
              fileNamePrefix={`${customerName || "customer"}-review`}
              onBusyChange={setImageBusy}
              disabled={pending || imageBusy}
            />
          </AdminCard>

          <AdminCard title="Visibility">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Published</p>
                <p className="text-xs text-muted-foreground">
                  Show on the storefront
                </p>
              </div>
              <Switch
                id="is_published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </AdminCard>
        </div>
      </div>

      <FormActions>
        <Button
          variant="outline"
          onClick={() => void cancel()}
          disabled={pending || imageBusy}
          className="rounded-full px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={pending || imageBusy}
          className="rounded-full px-6"
        >
          {pending || imageBusy ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {review ? "Save changes" : "Create review"}
        </Button>
      </FormActions>
    </div>
  );
}
