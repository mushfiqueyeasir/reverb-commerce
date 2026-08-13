"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  FormActions,
  FormField,
  adminInputClass,
} from "@/components/admin/FormField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CmsPage } from "@/lib/cms/jsonStore";
import { savePage } from "../actions";

export function PageForm({
  page,
  canWrite,
}: {
  page: CmsPage;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body_html);

  const submit = () => {
    if (!canWrite) return;
    startTransition(async () => {
      const res = await savePage({
        slug: page.slug,
        title,
        body_html: body,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Page saved");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <AdminCard
        title="Page content"
        description="Title and body shown on the storefront."
      >
        <div className="space-y-5">
          <FormField label="Page title" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canWrite}
              className={adminInputClass}
            />
          </FormField>
          <FormField label="Content">
            <RichTextEditor value={body} onChange={setBody} />
          </FormField>
        </div>
      </AdminCard>

      {canWrite && (
        <FormActions>
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
            Save page
          </Button>
        </FormActions>
      )}
    </div>
  );
}
