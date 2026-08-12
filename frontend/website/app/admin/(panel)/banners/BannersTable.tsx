"use client";

import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, GalleryHorizontalEnd } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import type { BannerRow, BannerSectionType } from "@/type/db";
import { BUCKETS } from "@/lib/supabase/config";
import { buildStoragePublicUrl } from "@/utility/storageUrl";
import { useAdmin } from "@/components/admin/AdminContext";
import { AdminList } from "@/components/admin/AdminList";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { deleteBanner, reorderBanners, toggleBanner } from "./actions";

function ActiveToggle({
  id,
  active,
  canWrite,
  sectionType,
}: {
  id: string;
  active: boolean;
  canWrite: boolean;
  sectionType: BannerSectionType;
}) {
  const [pending, startTransition] = useTransition();

  if (!canWrite) {
    return (
      <Badge variant={active ? "success" : "secondary"}>
        {active ? "Active" : "Inactive"}
      </Badge>
    );
  }

  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={(next) =>
        startTransition(async () => {
          const res = await toggleBanner(id, next, sectionType);
          if (res?.error) toast.error(res.error);
          else toast.success(next ? "Activated" : "Deactivated");
        })
      }
      aria-label="Toggle active"
    />
  );
}

export function BannersTable({
  data,
  canWrite,
  sectionType,
  editBasePath = "/admin/homepage/banners",
  sectionId,
}: {
  data: BannerRow[];
  canWrite: boolean;
  sectionType: BannerSectionType;
  editBasePath?: string;
  sectionId?: string;
}) {
  const { storageBaseUrl } = useAdmin();
  const editHref = (id: string) =>
    sectionId
      ? `${editBasePath}/${id}?section=${sectionId}`
      : `${editBasePath}/${id}`;

  return (
    <AdminList
      items={data}
      sortable
      canReorder={canWrite}
      onReorder={(orderedIds) => reorderBanners(orderedIds, sectionType)}
      hint="Drag the handle to reorder slides on the storefront."
      searchPlaceholder="Search slides…"
      searchFilter={(item, q) =>
        (item.title ?? "").toLowerCase().includes(q) ||
        (item.subtitle ?? "").toLowerCase().includes(q)
      }
      emptyMessage="No banner slides yet. Create your first slide."
      renderLeading={(item) => {
        const url = buildStoragePublicUrl(
          storageBaseUrl,
          BUCKETS.banner,
          item.image_path,
        );
        return (
          <div className="relative h-12 w-20 overflow-hidden rounded-md border border-border bg-muted">
            {url ? (
              <Image
                src={url}
                alt={item.title ?? "Banner"}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <GalleryHorizontalEnd className="size-5" />
              </div>
            )}
          </div>
        );
      }}
      renderTitle={(item) =>
        item.title || <span className="text-muted-foreground">No headline</span>
      }
      renderSubtitle={(item) => item.subtitle || null}
      renderTrailing={(item) => (
        <>
          <ActiveToggle
            id={item.id}
            active={item.active}
            canWrite={canWrite}
            sectionType={sectionType}
          />
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href={editHref(item.id)} aria-label="Edit">
              <Pencil className="size-4" />
            </Link>
          </Button>
          {canWrite ? (
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
              title="Delete banner?"
              description={`"${item.title || "This slide"}" will be permanently removed.`}
              confirmLabel="Delete"
              action={() => deleteBanner(item.id, sectionType)}
            />
          ) : null}
        </>
      )}
    />
  );
}
